-- Vista de inventario por tienda y libro (issue #172)
DROP VIEW IF EXISTS public.vista_inventario;

CREATE VIEW public.vista_inventario
WITH (security_invoker = true) AS
SELECT
  c.id_tienda AS tienda_id,
  l.id AS libro_id,
  l.titulo,
  l.isbn,
  l.precio AS precio_actual,
  COUNT(c.id) AS stock_total,
  COUNT(c.id) FILTER (WHERE c.estado = 'disponible') AS stock_disponible,
  l.estado AS condicion_libro,
  a.nombre AS autor_libro
FROM public.copia AS c
INNER JOIN public.libro AS l
  ON l.id = c.id_libro
INNER JOIN public.autor AS a
  ON a.id = l.id_autor
INNER JOIN public.tienda AS t
  ON t.id = c.id_tienda
WHERE
  c.deleted_at IS NULL
  AND l.deleted_at IS NULL
  AND t.deleted_at IS NULL
GROUP BY
  c.id_tienda,
  l.id,
  l.titulo,
  l.isbn,
  l.precio,
  l.estado,
  a.nombre;

REVOKE SELECT ON public.vista_inventario FROM anon, authenticated;
