-- 1. Eliminar la FK actual que apunta a 'public.usuario'
-- Esta FK generaba fallos cuando el actor (ej: ROOT) no tiene un perfil público.
ALTER TABLE IF EXISTS public.auditoria 
DROP CONSTRAINT IF EXISTS "Auditoria_id_usuario_fkey";

-- 2. Crear la nueva FK que apunta a 'auth.users' (esquema de Supabase Auth)
-- Es el origen de la verdad para la identidad de cualquier actor del sistema.
ALTER TABLE IF EXISTS public.auditoria
ADD CONSTRAINT "auditoria_id_usuario_auth_fkey"
FOREIGN KEY (id_usuario) REFERENCES auth.users(id)
ON DELETE SET NULL;
