-- Actualizar vista_noticias_completa para incluir el campo orden
-- Primero eliminar la vista existente
DROP VIEW IF EXISTS vista_noticias_completa;

-- Crear vista_noticias_completa con el campo orden
CREATE VIEW vista_noticias_completa AS
SELECT 
  n.id,
  n.id_libro,
  n.fecha_publicacion,
  n.fecha_expiracion,
  n.es_visible,
  n.deleted_at,
  n.imagenes,
  n.orden,
  l.titulo,
  l.isbn,
  l.precio,
  l.idioma,
  l.editorial,
  l.estado,
  l.fecha_publicacion AS libro_fecha_publicacion,
  l.ano_publicacion,
  l.paginas,
  l.sipnosis,
  a.id AS autor_id,
  a.nombre AS autor_nombre,
  c.id AS categoria_id,
  c.nombre AS categoria_nombre,
  COALESCE(inv.stock_disponible, 0) AS stock_disponible
FROM noticias n
JOIN libro l ON n.id_libro = l.id AND l.deleted_at IS NULL
LEFT JOIN autor a ON l.id_autor = a.id AND a.deleted_at IS NULL
LEFT JOIN categoria c ON l.id_categoria = c.id AND c.deleted_at IS NULL
LEFT JOIN (
  SELECT 
    id_libro,
    COUNT(*) AS stock_disponible
  FROM copia
  WHERE estado = 'disponible'
  GROUP BY id_libro
) inv ON inv.id_libro = l.id
WHERE n.deleted_at IS NULL;
