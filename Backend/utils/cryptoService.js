const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const jwt = require('jsonwebtoken');

const ENCRYPTED_PREFIX = 'enc:v1:';
let encryptionKey;
let privateKey;
let publicKey;

const resolveKeyPath = (environmentVariable, defaultPath) =>
  path.resolve(__dirname, '..', process.env[environmentVariable] || defaultPath);

const readKeyFile = (environmentVariable, defaultPath) => {
  const filePath = resolveKeyPath(environmentVariable, defaultPath);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `No se encontró la llave requerida: ${filePath}. Ejecuta "npm run keys:generate" en Backend.`
    );
  }
  return fs.readFileSync(filePath);
};

const getEncryptionKey = () => {
  if (!encryptionKey) {
    const encodedKey = readKeyFile('ENCRYPTION_KEY_PATH', 'keys/encryption.key')
      .toString('utf8')
      .trim();
    const decodedKey = Buffer.from(encodedKey, 'base64');

    if (
      decodedKey.length !== 32 ||
      decodedKey.toString('base64').replace(/=+$/, '') !== encodedKey.replace(/=+$/, '')
    ) {
      throw new Error('La llave AES debe ser un valor Base64 válido de exactamente 32 bytes.');
    }

    encryptionKey = decodedKey;
  }
  return encryptionKey;
};

const getPrivateKey = () => {
  if (!privateKey) {
    privateKey = crypto.createPrivateKey(
      readKeyFile('JWT_PRIVATE_KEY_PATH', 'keys/jwt-private.pem')
    );
    if (
      privateKey.asymmetricKeyType !== 'rsa' ||
      privateKey.asymmetricKeyDetails.modulusLength < 2048
    ) {
      throw new Error('La llave privada JWT debe ser RSA de al menos 2048 bits.');
    }
  }
  return privateKey;
};

const getPublicKey = () => {
  if (!publicKey) {
    publicKey = crypto.createPublicKey(
      readKeyFile('JWT_PUBLIC_KEY_PATH', 'keys/jwt-public.pem')
    );
    if (
      publicKey.asymmetricKeyType !== 'rsa' ||
      publicKey.asymmetricKeyDetails.modulusLength < 2048
    ) {
      throw new Error('La llave pública JWT debe ser RSA de al menos 2048 bits.');
    }
  }
  return publicKey;
};

const encryptSensitiveData = (value) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    'enc:v1',
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64')
  ].join(':');
};

const decryptSensitiveData = (value) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  if (!value.startsWith('enc:')) {
    return value;
  }
  if (!value.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error('La versión del dato cifrado no es compatible.');
  }

  const [scheme, version, encodedIv, encodedAuthTag, encodedCiphertext, ...extraParts] =
    value.split(':');
  if (
    scheme !== 'enc' ||
    version !== 'v1' ||
    extraParts.length > 0 ||
    !encodedIv ||
    !encodedAuthTag ||
    encodedCiphertext === undefined
  ) {
    throw new Error('El dato cifrado tiene un formato inválido.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64')),
    decipher.final()
  ]).toString('utf8');
};

const signToken = (payload) =>
  jwt.sign(payload, getPrivateKey(), { algorithm: 'RS256', expiresIn: '8h' });

const verifyToken = (token) =>
  jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });

const validateCryptoConfiguration = () => {
  getEncryptionKey();
  const signingKey = getPrivateKey();
  const verificationKey = getPublicKey();
  const challenge = Buffer.from('validacion-de-par-de-claves-jwt');
  const signature = crypto.sign('sha256', challenge, signingKey);

  if (!crypto.verify('sha256', challenge, verificationKey, signature)) {
    throw new Error('Las llaves pública y privada JWT no corresponden al mismo par.');
  }
};

module.exports = {
  encryptSensitiveData,
  decryptSensitiveData,
  signToken,
  verifyToken,
  validateCryptoConfiguration
};
