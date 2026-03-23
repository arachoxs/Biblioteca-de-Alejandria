CREATE OR REPLACE VIEW vista_administradores AS
SELECT 
    u.id,
    u.email,
    -- Extraemos el rol del JSON de metadata de Auth
    (u.raw_app_meta_data->>'role') AS rol,
    -- Traemos los datos del perfil (si existen)
    p.nombres,
    p.apellidos,
    u.created_at
FROM auth.users u
LEFT JOIN public.usuario p ON u.id = p.id
WHERE u.raw_app_meta_data->>'role' = 'ADMINISTRADOR';