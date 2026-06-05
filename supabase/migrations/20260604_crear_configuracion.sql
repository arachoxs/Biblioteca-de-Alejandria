-- Tabla de configuración del sistema (key-value con JSONB).
-- Solo accesible por usuarios con rol ROOT (RLS).

CREATE TABLE public.configuracion (
  clave text PRIMARY KEY,
  valor jsonb NOT NULL,
  descripcion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed: porcentaje de descuento de cumpleaños
INSERT INTO public.configuracion (clave, valor, descripcion)
VALUES (
  'promocion_cumpleanos_porcentaje',
  '15',
  'Porcentaje de descuento para la promoción de cumpleaños'
);

-- RLS: solo ROOT puede leer y escribir
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_root_select" ON public.configuracion
  FOR SELECT USING (current_app_role() = 'ROOT');

CREATE POLICY "config_root_all" ON public.configuracion
  FOR ALL USING (current_app_role() = 'ROOT');
