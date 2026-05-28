-- Agregar columna de orden para drag-and-drop en gestión de noticias
ALTER TABLE noticias ADD COLUMN orden integer DEFAULT 0;

-- Índice parcial para consultas ordenadas (solo noticias activas)
CREATE INDEX idx_noticias_orden ON noticias(orden) WHERE deleted_at IS NULL;

-- Backfill: asignar orden basado en fecha_publicacion descendente (más reciente = primero)
UPDATE noticias 
SET orden = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY fecha_publicacion DESC) as rn
  FROM noticias 
  WHERE deleted_at IS NULL
) sub
WHERE noticias.id = sub.id;
