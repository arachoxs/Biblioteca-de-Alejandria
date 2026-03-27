-- Modificar la vista vista_administradores para añadir el campo habilitado
-- Este campo se calcula a partir del estado de ban en auth.users

DROP VIEW IF EXISTS vista_administradores;

CREATE VIEW vista_administradores AS
SELECT 
    (u.id::text)::uuid AS id,
    u.email,
    -- Extraemos el rol del JSON
    (u.raw_app_meta_data->>'role') AS rol,
    -- Fusionamos y eliminamos las columnas individuales
    NULLIF(concat_ws(' ', p.nombres, p.apellidos), '') AS nombre_completo,
    u.created_at,
    -- Campo habilitado: true si banned_until es NULL o está en el pasado
    (u.banned_until IS NULL OR u.banned_until < NOW()) AS habilitado
FROM auth.users u
LEFT JOIN public.usuario p ON u.id = p.id
WHERE u.raw_app_meta_data->>'role' = 'ADMINISTRADOR';

-- Tras recrear la vista, se revocan explícitamente los permisos de anon y authenticated para dejarla sin acceso por parte de estos roles.
REVOKE SELECT ON vista_administradores FROM anon, authenticated;
