# Documentación de la integración criptográfica

## Resumen

El sistema de gestión hospitalaria incorpora dos mecanismos criptográficos
con usos diferentes:

1. **Cifrado simétrico AES-256-GCM** para proteger campos de texto sensibles
   guardados en PostgreSQL.
2. **Firma asimétrica RSA mediante JWT RS256** para autenticar a los usuarios
   y verificar que el token no fue alterado.

La implementación está en el backend Node.js. El navegador envía y recibe
datos en claro a través de la aplicación; el backend cifra antes de escribir
en la base y descifra después de leer.

## 1. Cifrado simétrico de datos

### ¿Qué información se cifra y por qué?

En las cirugías se cifran:

- `cirugias.diagnostico_pre`: diagnóstico previo a la cirugía.
- `cirugias.diagnostico_post`: diagnóstico posterior a la cirugía.

Los diagnósticos revelan condiciones de salud del paciente, por lo que son
información clínica sensible. Proteger estos campos limita la exposición si
alguien obtiene acceso de solo lectura a la base de datos o a un respaldo.

También se cifra `expedientes.procedencia`, que se había integrado inicialmente
como campo sensible del expediente. No es el principal dato clínico elegido
para la actividad, pero se conserva el cifrado y su descifrado para mantener
el flujo existente.

### Librerías elegidas

- **`node:crypto`**, módulo criptográfico integrado de Node.js: genera bytes
  aleatorios, crea el cifrador AES-GCM y maneja la llave. No implementamos el
  algoritmo manualmente ni añadimos una dependencia para AES.
- **AES-256-GCM** usa una llave de 256 bits y proporciona confidencialidad e
  integridad autenticada. Cada cifrado genera un nonce aleatorio de 12 bytes;
  el nonce y la etiqueta de autenticación se guardan junto al texto cifrado.

### Código de cifrado y descifrado

El servicio común está en [`Backend/utils/cryptoService.js`](Backend/utils/cryptoService.js).
El núcleo del cifrado es:

```js
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
const ciphertext = Buffer.concat([
  cipher.update(String(value), 'utf8'),
  cipher.final()
]);
const authTag = cipher.getAuthTag();
```

El valor persistido tiene este formato:

```text
enc:v1:<nonce-base64>:<etiqueta-base64>:<texto-cifrado-base64>
```

El prefijo identifica el formato y su versión; el nonce no es secreto y se
requiere para descifrar. La etiqueta GCM permite rechazar datos manipulados.
Durante el descifrado se restaura la etiqueta antes de finalizar:

```js
const decipher = crypto.createDecipheriv(
  'aes-256-gcm',
  getEncryptionKey(),
  Buffer.from(encodedIv, 'base64')
);
decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64'));
```

Si la autenticación falla —por ejemplo, por texto cifrado o etiqueta
modificados, o por una llave incorrecta—, la operación de descifrado falla;
el servicio no devuelve el contenido como si fuera válido. Los datos antiguos
sin el prefijo `enc:` se leen como texto claro para mantener compatibilidad
durante la transición.

### Dónde se aplica

[`Backend/models/cirugiaModel.js`](Backend/models/cirugiaModel.js) cifra los
diagnósticos en los dos puntos de escritura:

- `create`: antes del `INSERT` de la cirugía.
- `update`: antes del `UPDATE` de un diagnóstico enviado.

Al consultar una cirugía, la función `decryptDiagnosticos` descifra ambos
campos. Se usa después de leer la lista completa, el detalle por ID, la
inserción y la actualización, de modo que la interfaz sigue recibiendo el
diagnóstico legible.

[`Backend/models/pacienteModel.js`](Backend/models/pacienteModel.js) aplica el
mismo servicio a `expedientes.procedencia` al crear o actualizar un expediente
y al leer pacientes.

### Migración de datos existentes

Las migraciones amplían a `TEXT` las columnas para almacenar el nonce, la
etiqueta y el texto cifrado:

- [`Backend/migrations/20261103_crypto_diagnosticos.sql`](Backend/migrations/20261103_crypto_diagnosticos.sql)
- [`Backend/migrations/20261103_crypto_procedencia.sql`](Backend/migrations/20261103_crypto_procedencia.sql)

Para cifrar diagnósticos que ya estaban guardados en claro se agregó
[`Backend/scripts/encrypt-existing-diagnoses.js`](Backend/scripts/encrypt-existing-diagnoses.js),
ejecutable desde `Backend`:

```powershell
npm run data:encrypt-diagnoses
```

El comando usa la llave del backend y una transacción de PostgreSQL. Omite
valores que ya tengan el prefijo `enc:v1:`, por lo que se puede repetir sin
cifrar dos veces los mismos campos. Antes de ejecutarlo se debe respaldar la
base y conservar la llave AES utilizada por el servidor.

## 2. Firma asimétrica para autenticación

### Caso de uso

Al iniciar sesión, el backend emite un JSON Web Token (JWT) firmado. Las rutas
protegidas verifican su firma antes de aceptar la identidad y el rol incluidos
en el token.

### Librerías elegidas

- **`jsonwebtoken`** crea y valida los JWT, y permite restringir explícitamente
  el algoritmo aceptado a `RS256`.
- **`node:crypto`** carga las llaves PEM y verifica al arrancar que ambas
  forman un par compatible.
- **RSA de 2048 bits** usa dos llaves: la privada firma; la pública verifica.
  La llave privada no se comparte con los clientes. A diferencia del cifrado,
  una firma digital no oculta el contenido del JWT: demuestra que fue emitido
  por quien posee la llave privada y que no se alteró.

### Flujo del token

1. [`Backend/controllers/authController.js`](Backend/controllers/authController.js)
   comprueba las credenciales y llama a `signToken`.
2. [`Backend/utils/cryptoService.js`](Backend/utils/cryptoService.js) firma con
   la llave privada y el algoritmo `RS256`; el token expira en ocho horas.
3. [`Backend/middleware/authMiddleware.js`](Backend/middleware/authMiddleware.js)
   llama a `verifyToken`, que acepta exclusivamente tokens `RS256` y verifica
   con la llave pública.
4. Si el token no es válido o expiró, la ruta responde `401`; si es válido,
   continúa con el usuario autenticado.

## 3. Generación y almacenamiento de llaves

El comando
[`Backend/scripts/generate-crypto-keys.js`](Backend/scripts/generate-crypto-keys.js)
genera localmente:

- `encryption.key`: 32 bytes aleatorios codificados en Base64.
- `jwt-private.pem`: llave privada RSA en formato PKCS#8.
- `jwt-public.pem`: llave pública RSA en formato SPKI.

Se generan con:

```powershell
cd Backend
npm run keys:generate
```

Las rutas se configuran mediante `ENCRYPTION_KEY_PATH`,
`JWT_PRIVATE_KEY_PATH` y `JWT_PUBLIC_KEY_PATH`. En Docker Compose las llaves
locales se montan como solo lectura y están excluidas de la imagen. El
directorio `Backend/keys/` está excluido de Git; no se deben subir ni compartir
las llaves. La pérdida de la llave AES impide recuperar los valores cifrados.
Para rotarla se necesita planificar y ejecutar un descifrado y recifrado.

Al iniciar, [`Backend/index.js`](Backend/index.js) llama a
`validateCryptoConfiguration`: valida tamaño y tipo de llaves, y confirma que
la llave pública corresponde a la privada. Si falta una llave o no coincide el
par, el servidor reporta el error en vez de iniciar con una configuración
criptográfica inválida.

## 4. Prueba y demostración

### Pruebas automatizadas

Desde `Backend`:

```powershell
npm run test:crypto
```

Las pruebas en [`Backend/test/crypto.test.js`](Backend/test/crypto.test.js)
comprueban:

- Cifrado AES-GCM y recuperación del texto original.
- Uso de nonce aleatorio, que produce distintos textos cifrados para el mismo
  valor de entrada.
- Rechazo de datos cifrados modificados y compatibilidad temporal con texto
  antiguo.
- Firma y verificación de JWT con RSA, así como rechazo de una firma alterada.

### Demo manual

1. Iniciar sesión y crear o editar una cirugía con datos de prueba inventados.
2. En la aplicación, mostrar que el diagnóstico aparece legible.
3. En pgAdmin, consultar:

   ```sql
   SELECT diagnostico_pre, diagnostico_post
   FROM public.cirugias
   ORDER BY id_cirugia DESC
   LIMIT 5;
   ```

4. Mostrar que los campos cifrados en la base empiezan con `enc:v1:` mientras
   que la respuesta de la aplicación contiene el texto descifrado.
5. Ejecutar `npm run test:crypto` y mostrar que las pruebas terminan
   correctamente.

No se deben usar diagnósticos reales durante la exposición ni pegar tokens
activos en páginas externas.

## Alcance y consideraciones

- Los diagnósticos pre y postoperatorios y la procedencia se cifran en la base;
  campos como nombre, fecha, procedimiento y resultado no se cifran con esta
  integración.
- El cifrado en la capa de aplicación protege los valores almacenados, pero no
  sustituye controles de acceso, respaldos protegidos, seguridad de red ni
  cifrado TLS en producción.
- Las claves privadas y AES son secretos operativos. Deben respaldarse y
  protegerse con acceso restringido; no deben incluirse en el repositorio ni
  en capturas de la presentación.
- El archivo [`README.md`](README.md) contiene también instrucciones de
  configuración y migración del proyecto.
