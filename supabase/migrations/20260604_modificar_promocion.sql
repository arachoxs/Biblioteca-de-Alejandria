-- Agrega columnas necesarias para el sistema de promociones por usuario.
-- id_usuario: vincula la promoción a un usuario específico
-- fecha_expiracion: cuándo vence la promoción (fin del día para cumpleaños)
-- usada: si la promoción ya fue aplicada en una compra

ALTER TABLE public.promocion
  ADD COLUMN id_usuario uuid NOT NULL REFERENCES public.usuario(id),
  ADD COLUMN fecha_expiracion timestamptz NOT NULL,
  ADD COLUMN usada boolean NOT NULL DEFAULT false;

-- Índice único: evita duplicados (un usuario no puede tener dos promociones
-- del mismo tipo en el mismo día)
CREATE UNIQUE INDEX idx_promocion_usuario_tipo_fecha
  ON public.promocion (id_usuario, tipo, (fecha_expiracion::date))
  WHERE deleted_at IS NULL;

-- Índice para el cron de limpieza de promociones expiradas
CREATE INDEX idx_promocion_expiracion
  ON public.promocion (fecha_expiracion)
  WHERE deleted_at IS NULL AND usada = false;
