-- Migración: Agregar políticas RLS para lectura pública de noticias
-- Fecha: 2026-05-19
-- Objetivo: Permitir que el cliente público (anon key) pueda leer noticias,
-- libros, autores y categorías sin filtro es_visible para la búsqueda pública

-- ============================================================
-- 1. HABILITAR RLS EN TABLAS (si no está habilitado)
-- ============================================================

ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.libro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categoria ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. ELIMINAR POLÍTICAS EXISTENTES ( idempotente )
-- ============================================================

DROP POLICY IF EXISTS "Permitir lectura pública noticias" ON public.noticias;
DROP POLICY IF EXISTS "Permitir lectura pública libros" ON public.libro;
DROP POLICY IF EXISTS "Permitir lectura pública autores" ON public.autor;
DROP POLICY IF EXISTS "Permitir lectura pública categorías" ON public.categoria;

-- ============================================================
-- 3. CREAR POLÍTICAS DE LECTURA PÚBLICA
-- ============================================================

-- Política para noticias: cualquier usuario puede LEER todos los registros
CREATE POLICY "Permitir lectura pública noticias"
ON public.noticias
FOR SELECT
TO anon
USING (true);

-- Política para libro: cualquier usuario puede LEER todos los libros
CREATE POLICY "Permitir lectura pública libros"
ON public.libro
FOR SELECT
TO anon
USING (true);

-- Política para autor: cualquier usuario puede LEER todos los autores
CREATE POLICY "Permitir lectura pública autores"
ON public.autor
FOR SELECT
TO anon
USING (true);

-- Política para categoría: cualquier usuario puede LEER todas las categorías
CREATE POLICY "Permitir lectura pública categorías"
ON public.categoria
FOR SELECT
TO anon
USING (true);

-- ============================================================
-- 4. NOTA IMPORTANTE
-- ============================================================
--
-- Las políticas INSERT, UPDATE, DELETE siguen controladas por RLS.
-- Solo el service_role key (createAdminClient) puede modificar datos.
--
-- La tabla noticias tiene un campo 'deleted_at' para soft-delete.
-- La query pública debe filtrar WHERE deleted_at IS NULL.
-- Esto ya está implementado en el modelo noticiaModel.ts existente.
--