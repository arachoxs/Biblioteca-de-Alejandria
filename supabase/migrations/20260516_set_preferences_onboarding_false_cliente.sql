-- Setea preferences_onboarding_complete = false en auth.users.user_metadata
-- para todos los usuarios con rol = 'CLIENTE' que aún no tienen el flag.

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{preferences_onboarding_complete}',
    'false'
  )
WHERE
  (raw_app_meta_data->>'role') = 'CLIENTE'
  AND COALESCE(raw_user_meta_data->>'preferences_onboarding_complete', 'null') = 'null';