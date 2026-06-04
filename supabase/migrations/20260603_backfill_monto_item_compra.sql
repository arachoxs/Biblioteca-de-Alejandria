UPDATE item_compra ic
SET monto = l.precio
FROM copia c
JOIN libro l ON l.id = c.id_libro
WHERE c.id = ic.id_copia;
