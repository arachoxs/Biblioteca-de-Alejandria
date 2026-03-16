UPDATE auth.users
SET 
    -- 1. Insertamos el valor en app_metadata bajo la llave 'role'
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', raw_user_meta_data->'rol'),
    
    -- 2. Eliminamos la llave 'rol' de user_metadata para limpiar
    raw_user_meta_data = raw_user_meta_data - 'rol'
WHERE 
    raw_user_meta_data ? 'rol';