-- Migración: Eliminar trigger de perfil vacío
-- Fecha: 2026-03-13
-- Descripción:
--   El trigger `on_auth_user_created_create_profile` intentaba insertar
--   solo el `id` en public.usuario al crear un usuario en auth.users.
--   Esto fallaba porque la tabla tiene restricciones NOT NULL en campos
--   como dni, nombres, id_direccion, etc.
--
--   El Server Action `registerUser` se encarga de insertar todos los datos
--   del perfil de forma completa (usando el cliente admin para bypasear RLS,
--   ya que el usuario aún no tiene sesión activa al momento del signup).


-- ============================================================
-- ELIMINAR TRIGGER DE PERFIL VACÍO
-- ============================================================

drop trigger if exists on_auth_user_created_create_profile on auth.users;
drop function if exists public.handle_new_user_profile();

