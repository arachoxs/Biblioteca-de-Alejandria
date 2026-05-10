-- 1. Agregar columna es_bodega (sin índice único, múltiples bodegas permitidas)
ALTER TABLE public.tienda
  ADD COLUMN es_bodega BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Las tiendas existentes quedan en FALSE automáticamente por el DEFAULT.
--    Esta línea es explícita por claridad, pero es redundante.
UPDATE public.tienda
  SET es_bodega = FALSE
  WHERE es_bodega IS DISTINCT FROM FALSE;

-- 3. Insertar la Bodega Principal
INSERT INTO public.tienda (nombre, horario, id_direccion, es_bodega)
VALUES (
  'Bodega Principal',
  '{"lunes":null,"martes":null,"miercoles":null,"jueves":null,"viernes":null,"sabado":null,"domingo":null}',
  49,
  TRUE
);