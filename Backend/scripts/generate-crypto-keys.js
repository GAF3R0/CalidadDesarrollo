const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const keysDirectory = process.env.CRYPTO_KEYS_DIRECTORY
  ? path.resolve(process.env.CRYPTO_KEYS_DIRECTORY)
  : path.join(__dirname, '..', 'keys');
fs.mkdirSync(keysDirectory, { recursive: true, mode: 0o700 });

const keyFiles = ['encryption.key', 'jwt-private.pem', 'jwt-public.pem'];
const existingFiles = keyFiles.filter((fileName) =>
  fs.existsSync(path.join(keysDirectory, fileName))
);

if (existingFiles.length > 0) {
  console.error(
    `No se reemplazaron llaves existentes (${existingFiles.join(', ')}). Respáldalas y retíralas manualmente si necesitas rotarlas.`
  );
  process.exitCode = 1;
} else {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' }
  });

  fs.writeFileSync(
    path.join(keysDirectory, 'encryption.key'),
    `${crypto.randomBytes(32).toString('base64')}\n`,
    { mode: 0o600, flag: 'wx' }
  );
  fs.writeFileSync(path.join(keysDirectory, 'jwt-private.pem'), privateKey, {
    mode: 0o600,
    flag: 'wx'
  });
  fs.writeFileSync(path.join(keysDirectory, 'jwt-public.pem'), publicKey, {
    mode: 0o644,
    flag: 'wx'
  });

  console.log(`Llaves generadas localmente en: ${keysDirectory}`);
  console.log('Restringe el acceso a estos archivos y nunca los agregues al repositorio.');
}
