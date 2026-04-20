-- Migración: Refactorización tipos
-- Objetivo: Preparar DB para refactor de noticias e logs histórico.

-- 1. Tabla: historico
-- Modificar 'fecha' a TIMESTAMPTZ para incluir hora exacta del log
ALTER TABLE public.historico
ALTER COLUMN fecha TYPE TIMESTAMPTZ USING fecha::TIMESTAMPTZ;

-- 2. Tabla: noticias
-- 2.1 Opcional: limpiar nulos si la consola falla al aplicar NOT NULL
-- DELETE FROM public.noticias WHERE id_libro IS NULL;

-- 2.2 Forzar id_libro a ser NOT NULL (noticia siempre ligada a un libro)
ALTER TABLE public.noticias
ALTER COLUMN id_libro SET NOT NULL;

-- 2.3 Agregar campo fecha_expiracion, default 8 días desde que se aplica
ALTER TABLE public.noticias
ADD COLUMN IF NOT EXISTS fecha_expiracion TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '8 days');

-- 2.4 Reemplazar FK para permitir ON DELETE CASCADE (aplica a borrados físicos)
ALTER TABLE public.noticias
DROP CONSTRAINT IF EXISTS noticias_id_libro_fkey;

ALTER TABLE public.noticias
ADD CONSTRAINT noticias_id_libro_fkey 
FOREIGN KEY (id_libro) REFERENCES public.libro(id) ON DELETE CASCADE;
