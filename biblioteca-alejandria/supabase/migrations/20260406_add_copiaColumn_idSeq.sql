--0. Limpiar la tabla 
DELETE FROM copia;

-- 1. Agregar la columna
ALTER TABLE copia
ADD COLUMN IF NOT EXISTS codigo_seq TEXT;

-- 2. Crear secuencia
CREATE SEQUENCE IF NOT EXISTS copia_codigo_seq;

-- 3. Función
CREATE OR REPLACE FUNCTION generar_codigo_copia()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar si no viene definido
  IF NEW.codigo_seq IS NULL THEN
    NEW.codigo_seq := 'COP-' || LPAD(nextval('copia_codigo_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger
DROP TRIGGER IF EXISTS trigger_codigo_copia ON copia;

CREATE TRIGGER trigger_codigo_copia
BEFORE INSERT ON copia
FOR EACH ROW
EXECUTE FUNCTION generar_codigo_copia();

-- 5. Restricción UNIQUE
ALTER TABLE copia
ADD CONSTRAINT copia_codigo_seq_unique UNIQUE (codigo_seq);
