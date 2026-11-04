-- Los diagnósticos se cifran desde la aplicación con AES-256-GCM.
-- TEXT almacena el nonce, la etiqueta de autenticación y el texto cifrado.
ALTER TABLE public.cirugias
  ALTER COLUMN diagnostico_pre TYPE TEXT,
  ALTER COLUMN diagnostico_post TYPE TEXT;
