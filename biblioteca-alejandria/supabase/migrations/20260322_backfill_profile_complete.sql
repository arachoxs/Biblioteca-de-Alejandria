-- Migración: Backfill profile_complete para admins existentes
-- Fecha: 2026-03-22
-- Descripción:
--   - Estampa profile_complete = true en app_metadata para todos los
--     administradores que ya tienen un registro completo en public.usuario.
--   - Estampa profile_complete = false para los administradores que NO
--     tienen perfil en public.usuario.
--   Debe ejecutarse ANTES de activar el guard en proxy.ts.

-- 1. Admins con perfil en public.usuario -> true
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"profile_complete": true}'::jsonb
WHERE id IN (SELECT id FROM public.usuario)
  AND raw_app_meta_data ->> 'role' = 'ADMINISTRADOR';

-- 2. Admins SIN perfil en public.usuario -> false
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"profile_complete": false}'::jsonb
WHERE id NOT IN (SELECT id FROM public.usuario)
  AND raw_app_meta_data ->> 'role' = 'ADMINISTRADOR';
