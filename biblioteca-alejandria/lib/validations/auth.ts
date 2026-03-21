// ─── Validación centralizada de contraseña ─────────────────────────
// Regla única aprobada: mínimo 8 caracteres.
// Usada en: registro, recuperación y cambio de contraseña.

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Valida que una contraseña cumpla los requisitos del sistema.
 * Retorna el mensaje de error o `null` si es válida.
 */
export function validatePasswordRule(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  return null;
}
