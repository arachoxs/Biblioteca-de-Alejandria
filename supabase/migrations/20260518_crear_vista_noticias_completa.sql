-- Migration: Create vista_noticias_completa for public search with OR semantics
-- Fecha: 2026-05-18
-- Objetivo: Vista que aplana las columnas de libros, autores y categorías
-- para permitir búsquedas OR con .or() en PostgREST

CREATE OR REPLACE VIEW public.vista_noticias_completa AS
SELECT 
  n.id,
  n.id_libro,
  n.fecha_publicacion,
  n.fecha_expiracion,
  n.es_visible,
  n.deleted_at,
  n.imagenes,
  l.titulo,
  l.isbn,
  l.precio,
  l.paginas,
  l.idioma,
  l.editorial,
  l.estado,
  l.fecha_publicacion AS libro_fecha_publicacion,
  l.ano_publicacion,
  a.id AS autor_id,
  a.nombre AS autor_nombre,
  c.id AS categoria_id,
  c.nombre AS categoria_nombre
FROM public.noticias n
INNER JOIN public.libro l ON l.id = n.id_libro
INNER JOIN public.autor a ON a.id = l.id_autor
INNER JOIN public.categoria c ON c.id = l.id_categoria
WHERE n.deleted_at IS NULL;

COMMENT ON VIEW public.vista_noticias_completa IS 'Vista para búsqueda pública de noticias con datos aplanados de libro, autor y categoría';
