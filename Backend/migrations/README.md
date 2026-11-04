# Migracion para datos cifrados

En bases de datos existentes, ejecuta una sola vez
`20261103_crypto_procedencia.sql` y `20261103_crypto_diagnosticos.sql`.
Luego, desde `Backend`, ejecuta `npm run data:encrypt-diagnoses` para cifrar
los diagnósticos preoperatorios y postoperatorios que ya existan. Este proceso
es idempotente: omite los valores con prefijo `enc:v1:`.

Haz una copia de seguridad de la base de datos y de `Backend/keys` antes de
ejecutar la migración. La llave AES debe ser la misma que usa el servidor; si
se pierde, no se podrán recuperar los datos cifrados. No rotes esa llave sin
un proceso de descifrado y recifrado.
