-- Migration: 20260422185000_ano_publicacion_generated
-- Convierte ano_publicacion a columna generada derivada de fecha_publicacion.
-- fecha_publicacion pasa a NOT NULL (era nullable).

-- 1. Rellenar fecha_publicacion nula usando el año existente en ano_publicacion
--    antes de agregar el constraint NOT NULL.
UPDATE libro
SET fecha_publicacion = ano_publicacion
WHERE fecha_publicacion IS NULL
  AND ano_publicacion IS NOT NULL
  AND deleted_at IS NULL;

-- 2. Para registros sin ninguno de los dos (edge case), usar fecha actual.
UPDATE libro
SET fecha_publicacion = CURRENT_DATE
WHERE fecha_publicacion IS NULL
  AND deleted_at IS NULL;

-- 3. Hacer fecha_publicacion NOT NULL.
ALTER TABLE libro
  ALTER COLUMN fecha_publicacion SET NOT NULL;

-- 4. Eliminar la columna original ano_publicacion.
ALTER TABLE libro
  DROP COLUMN ano_publicacion;

-- 5. Agregar ano_publicacion como columna generada (derivada del año de fecha_publicacion).
ALTER TABLE libro
  ADD COLUMN ano_publicacion integer GENERATED ALWAYS AS (CAST(EXTRACT(YEAR FROM fecha_publicacion) AS integer)) STORED;
