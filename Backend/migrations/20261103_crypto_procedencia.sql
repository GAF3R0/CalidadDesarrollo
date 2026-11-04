-- AES-GCM agrega metadatos de nonce y autenticacion, por lo que procedencia
-- debe poder almacenar valores mayores que los textos en claro anteriores.
ALTER TABLE public.expedientes
  ALTER COLUMN procedencia TYPE TEXT;
