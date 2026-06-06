-- Migration: Backfill modelo_ra for existing books
-- Creates a default modelo_ra row for every libro that doesn't have one yet,
-- and links it via libro.id_modeloRA.

DO $$
DECLARE
  libro_rec RECORD;
  new_modelo_id BIGINT;
  profundidad_val NUMERIC;
BEGIN
  FOR libro_rec IN
    SELECT id, paginas
    FROM public.libro
    WHERE "id_modeloRA" IS NULL
      AND deleted_at IS NULL
  LOOP
    -- Calculate depth: pages * 0.007 cm
    profundidad_val := GREATEST(libro_rec.paginas * 0.007, 0.1);

    -- Insert default modelo_ra
    INSERT INTO public.modelo_ra (dimensiones, texturas)
    VALUES (
      json_build_object(
        'ancho', 17,
        'alto', 24,
        'profundidad', ROUND(profundidad_val, 2)
      ),
      json_build_object(
        'portada', null,
        'contraportada', null,
        'lomo', null
      )
    )
    RETURNING id INTO new_modelo_id;

    -- Link libro to the new modelo_ra
    UPDATE public.libro
    SET "id_modeloRA" = new_modelo_id
    WHERE id = libro_rec.id;
  END LOOP;
END;
$$;
