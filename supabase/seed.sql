-- seed.sql: Datos iniciales de la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- Habilitar extensión para cifrado de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Limpiar usuario root previo (si existe)
DELETE FROM auth.identities WHERE user_id = '7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6';
DELETE FROM auth.users WHERE id = '7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6';
DELETE FROM auth.users WHERE email = 'root@alejandria.com';

-- 2. Insertar usuario Root en auth.users
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
  is_sso_user,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'root@alejandria.com',
  crypt('RootPassword123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"role":"ROOT"}'::jsonb,
  '{"email_verified":true}'::jsonb,
  false,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Insertar identidad de Root en auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6',
  '7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6',
  '{"sub":"7b5083c2-40e9-4e0d-b892-0a41f6e2f1e6","email":"root@alejandria.com","email_verified":true,"phone_verified":false}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

-- 4. Verificar que el usuario fue creado
SELECT id, email, role, raw_app_meta_data FROM auth.users WHERE email = 'root@alejandria.com';