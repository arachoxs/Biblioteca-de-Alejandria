-- ============================================================
-- 1. AGREGAR COLUMNA id_usuario CON EL TIPO CORRECTO (UUID)
-- ============================================================

-- Si la tabla tiene datos previos, remover el "NOT NULL" temporalmente 
-- para evitar que truene si auth.uid() da NULL en la migración.
ALTER TABLE public.compra
ADD COLUMN IF NOT EXISTS id_usuario UUID DEFAULT auth.uid();

-- ============================================================
-- 2. AGREGAR LLAVE FORÁNEA A usuario
-- ============================================================

ALTER TABLE public.compra
DROP CONSTRAINT IF EXISTS Compra_id_usuario_fkey;

ALTER TABLE public.compra
ADD CONSTRAINT Compra_id_usuario_fkey
FOREIGN KEY (id_usuario)
REFERENCES public.usuario(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE public.compra ALTER COLUMN id_usuario SET NOT NULL;

-- ============================================================
-- 3. CREAR ÍNDICE PARA BÚSQUEDAS POR USUARIO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_compra_id_usuario
ON public.compra(id_usuario);

-- ============================================================
-- 4. HABILITAR RLS
-- ============================================================

ALTER TABLE public.compra ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLÍTICAS RLS (Ahora compatibles con tipo UUID)
-- ============================================================

DROP POLICY IF EXISTS "Usuario puede ver sus compras" ON public.compra;
CREATE POLICY "Usuario puede ver sus compras"
ON public.compra
FOR SELECT
TO authenticated
USING (auth.uid() = id_usuario);