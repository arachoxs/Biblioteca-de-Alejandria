-- Vista de libros para el agente de recomendación (chatbot)
-- Incluye: info completa del libro, autor, categoría, y conteo de copias por estado
-- Filtra automáticamente libros sin copias disponibles
DROP VIEW IF EXISTS public.vista_libros_recomendacion;

CREATE VIEW public.vista_libros_recomendacion
WITH (security_invoker = true) AS
SELECT
  l.id AS libro_id,
  l.titulo,
  l.isbn,
  l.idioma,
  l.sipnosis,
  l.paginas,
  l.precio,
  l.estado AS condicion_libro,
  l.editorial,
  l.fecha_publicacion,
  l.ano_publicacion,
  a.id AS autor_id,
  a.nombre AS autor_nombre,
  a.nacionalidad AS autor_nacionalidad,
  c.id AS categoria_id,
  c.nombre AS categoria_nombre,
  c.descripcion AS categoria_descripcion,
  inv.copias_disponibles,
  inv.copias_reservadas,
  inv.copias_vendidas
FROM public.libro AS l
INNER JOIN public.autor AS a
  ON a.id = l.id_autor AND a.deleted_at IS NULL
INNER JOIN public.categoria AS c
  ON c.id = l.id_categoria AND c.deleted_at IS NULL
INNER JOIN (
  SELECT
    id_libro,
    COUNT(*) FILTER (WHERE estado = 'disponible') AS copias_disponibles,
    COUNT(*) FILTER (WHERE estado = 'reservado') AS copias_reservadas,
    COUNT(*) FILTER (WHERE estado = 'vendido') AS copias_vendidas
  FROM public.copia
  WHERE deleted_at IS NULL
  GROUP BY id_libro
) inv ON inv.id_libro = l.id
WHERE
  l.deleted_at IS NULL
  AND inv.copias_disponibles > 0;

REVOKE SELECT ON public.vista_libros_recomendacion FROM anon, authenticated;
