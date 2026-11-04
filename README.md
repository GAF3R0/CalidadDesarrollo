# CalidadDesarrollo

Sistema de gestión hospitalaria con cifrado de información clínica y
autenticación mediante tokens firmados.

## Preparar el entorno criptográfico

Las llaves se guardan localmente en `Backend/keys/` (ignorado por Git):

```powershell
cd Backend
npm run keys:generate
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run test:crypto
npm start
```

Configura en `Backend/.env` los datos reales de PostgreSQL y el origen del
frontend. Las rutas de llave del ejemplo funcionan desde la carpeta Backend.
No compartas ni subas `Backend/keys/` o el archivo `.env`; en producción usa
un almacén de secretos y conserva respaldos seguros de las llaves.

Con Docker Compose, el backend se conecta por defecto al PostgreSQL de la
máquina (`host.docker.internal`), para usar la misma base que pgAdmin. El
servicio PostgreSQL opcional de Docker está bajo el perfil `docker-db`; si
quieres usarlo, configura `DB_HOST=db` en el `.env` raíz de Compose.
Configura `DB_PASSWORD` en el `.env` raíz (puedes copiar
`.env.example` y sustituir el valor de ejemplo); no guardes contraseñas reales
en archivos versionados.

Si la tabla `medicos_usuarios` está vacía, crea el primer administrador desde
una terminal interactiva con `npm run admin:bootstrap` en `Backend`. El comando
pide una contraseña oculta, crea su hash bcrypt y solo funciona mientras no
haya usuarios; no escribas la contraseña en el código ni la compartas.

Para una base ya creada, ejecuta una vez las migraciones
[`20261103_crypto_procedencia.sql`](Backend/migrations/20261103_crypto_procedencia.sql)
y [`20261103_crypto_diagnosticos.sql`](Backend/migrations/20261103_crypto_diagnosticos.sql)
con pgAdmin. Después, cifra los diagnósticos existentes desde `Backend` con
`npm run data:encrypt-diagnoses`; el comando usa la llave local y se puede
ejecutar de nuevo sin volver a cifrar valores que ya tengan el prefijo `enc:v1:`.

## Demo para la actividad

1. Inicia PostgreSQL y el backend; inicia el frontend desde `Frontend` con
   `npm run dev`. Inicia sesión y registra una cirugía de prueba inventada,
   con un diagnóstico preoperatorio como `Apendicitis aguda (dato de demo)`.
2. En la vista de cirugías, el diagnóstico sigue apareciendo en claro porque
   el backend lo descifra al devolverlo.
3. En PostgreSQL, consulta el valor persistido:

   ```sql
   SELECT diagnostico_pre, diagnostico_post
   FROM public.cirugias
   ORDER BY id_cirugia DESC
   LIMIT 5;
   ```

   Los diagnósticos registrados o actualizados muestran `enc:v1:...` (el
   texto cambia por el nonce aleatorio), no el texto clínico original.
4. Para la parte asimétrica, muestra que el encabezado del JWT contiene
   `"alg":"RS256"` y que las rutas de pacientes rechazan un token ausente o
   modificado. El inicio de sesión firma con `jwt-private.pem`; el middleware
   verifica con `jwt-public.pem`.
5. Ejecuta `npm run test:crypto` en `Backend` para comprobar cifrado,
   descifrado, detección de alteraciones y firma/verificación RSA.

## Mecanismos y llaves

- **Simétrico:** AES-256-GCM usando el módulo `node:crypto` de Node.js. Se cifran
  los diagnósticos preoperatorio y postoperatorio en `cirugias` antes de
  insertarlos o actualizarlos; al consultarlos, el backend los descifra para la
  interfaz. Son datos clínicos que revelan condiciones y estado de salud; la
  confidencialidad de la base de datos ayuda a reducir su exposición. GCM
  también autentica el contenido para detectar alteraciones.
- **Asimétrico:** JWT RS256 mediante `jsonwebtoken`. Solo la llave privada
  firma; la llave pública verifica el token de autenticación en las rutas
  protegidas.
- `npm run keys:generate` crea aleatoriamente la llave AES de 32 bytes y el
  par RSA de 2048 bits. Las rutas se configuran con
  `ENCRYPTION_KEY_PATH`, `JWT_PRIVATE_KEY_PATH` y `JWT_PUBLIC_KEY_PATH`.
  Protege el acceso a los archivos; la pérdida de la llave AES impide recuperar
  los datos. No uses las llaves de desarrollo en producción.

La URL del repositorio para entregar está en
[`ENTREGA_REPOSITORIO.txt`](ENTREGA_REPOSITORIO.txt).
