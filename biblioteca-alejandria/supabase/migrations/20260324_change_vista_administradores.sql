DROP VIEW IF EXISTS vista_administradores;

CREATE VIEW vista_administradores AS
SELECT 
    (u.id::text)::uuid AS id,
    u.email,
    -- Extraemos el rol del JSON
    (u.raw_app_meta_data->>'role') AS rol,
    -- Fusionamos y eliminamos las columnas individuales
    NULLIF(concat_ws(' ', p.nombres, p.apellidos), '') AS nombre_completo,
    u.created_at
FROM auth.users u
LEFT JOIN public.usuario p ON u.id = p.id
WHERE u.raw_app_meta_data->>'role' = 'ADMINISTRADOR';

-- RECUERDA: Al hacer DROP, los permisos se borran. Hay que aplicarlos de nuevo.
REVOKE SELECT ON vista_administradores FROM anon, authenticated;