-- Migration: 20260425230000_add_imagenes_to_noticias
-- Agrega columna imagenes (JSON) a la tabla noticias para almacenar
-- un array de URLs de imágenes del libro asociado a la noticia.

ALTER TABLE noticias
  ADD COLUMN imagenes jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN noticias.imagenes IS 'Array de URLs de imágenes del libro en Supabase Storage';