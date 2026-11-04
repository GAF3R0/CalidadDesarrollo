const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'calidad-crypto-'));
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' }
});

fs.writeFileSync(
  path.join(temporaryDirectory, 'encryption.key'),
  crypto.randomBytes(32).toString('base64')
);
fs.writeFileSync(path.join(temporaryDirectory, 'jwt-private.pem'), privateKey);
fs.writeFileSync(path.join(temporaryDirectory, 'jwt-public.pem'), publicKey);

process.env.ENCRYPTION_KEY_PATH = path.join(temporaryDirectory, 'encryption.key');
process.env.JWT_PRIVATE_KEY_PATH = path.join(temporaryDirectory, 'jwt-private.pem');
process.env.JWT_PUBLIC_KEY_PATH = path.join(temporaryDirectory, 'jwt-public.pem');

const {
  encryptSensitiveData,
  decryptSensitiveData,
  signToken,
  verifyToken,
  validateCryptoConfiguration
} = require('../utils/cryptoService');

before(() => {
  validateCryptoConfiguration();
});

after(() => {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  delete process.env.ENCRYPTION_KEY_PATH;
  delete process.env.JWT_PRIVATE_KEY_PATH;
  delete process.env.JWT_PUBLIC_KEY_PATH;
});

test('cifra datos con AES-256-GCM y los descifra al leerlos', () => {
  const plaintext = 'Urgencias - dato de prueba inventado';
  const ciphertext = encryptSensitiveData(plaintext);

  assert.match(ciphertext, /^enc:v1:/);
  assert.notEqual(ciphertext, plaintext);
  assert.equal(decryptSensitiveData(ciphertext), plaintext);
  assert.notEqual(encryptSensitiveData(plaintext), ciphertext);
});

test('detecta cambios en datos cifrados y conserva texto previo a la migración', () => {
  const ciphertext = encryptSensitiveData('Dato inventado');
  const parts = ciphertext.split(':');
  parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;

  assert.throws(() => decryptSensitiveData(parts.join(':')));
  assert.equal(decryptSensitiveData('Dato anterior a la migración'), 'Dato anterior a la migración');
  assert.equal(decryptSensitiveData(null), null);
});

test('firma JWT con RSA y rechaza firmas modificadas', () => {
  const token = signToken({ usuario: { id: 7, role: 'Medico' } });

  assert.deepEqual(verifyToken(token).usuario, { id: 7, role: 'Medico' });

  const parts = token.split('.');
  parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
  assert.throws(() => verifyToken(parts.join('.')));
});
