-- Atomic increment for tarjeta saldo (supports negative amounts for reversals)
CREATE OR REPLACE FUNCTION add_tarjeta_balance(tarjeta_id INTEGER, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tarjeta
  SET saldo = saldo + amount
  WHERE id = tarjeta_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarjeta no encontrada o eliminada';
  END IF;
END;
$$;