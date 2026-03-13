-- seed.sql: Datos iniciales de la base de datos

-- Habilitar extensión en el esquema de la base si no existe para cifrar contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  root_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Verificar si el usuario ya existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = root_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      root_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'root@alejandria.com',
      crypt('RootPassword123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"role":"ROOT"}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );
  END IF;
END $$;