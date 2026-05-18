-- Add last 4 digits column for display purposes (industry standard: Stripe, PayPal, etc.)
-- The full card number remains hashed with bcrypt for security.
ALTER TABLE tarjeta ADD COLUMN ultimos_cuatro_digitos VARCHAR(4) NOT NULL DEFAULT '0000';
