-- Agregar campos de última lectura para notificaciones in-app
-- ultima_lectura_admin: última vez que un admin vio el hilo (NULL = nunca lo ha leído)
-- ultima_lectura_cliente: última vez que el cliente vio el hilo

ALTER TABLE hilo_mensajeria
ADD COLUMN ultima_lectura_admin timestamptz DEFAULT NULL;

ALTER TABLE hilo_mensajeria
ADD COLUMN ultima_lectura_cliente timestamptz DEFAULT now();
