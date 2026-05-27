-- ============================================================
-- 1. ELIMINAR LLAVE FORÁNEA (debe ir antes de drop column)
-- ============================================================

ALTER TABLE public.entrega DROP CONSTRAINT IF EXISTS Entrega_id_direccion_origen_fkey;

-- ============================================================
-- 2. ELIMINAR COLUMNA id_direccion_origen
-- ============================================================

ALTER TABLE public.entrega DROP COLUMN IF EXISTS id_direccion_origen;
