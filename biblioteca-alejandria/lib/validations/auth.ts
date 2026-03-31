// ─── Constantes de validación ──────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_NOMBRE = 100;
export const MAX_APELLIDO = 100;
export const MAX_USUARIO = 30;
export const MAX_DNI = 20;
export const MIN_DNI = 5;
export const MAX_DIRECCION_DETALLE = 250;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

// ─── Utilidades de sanitización ────────────────────────────────────

/** Trim + colapsar espacios múltiples internos. */
export function sanitizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

// ─── Validadores genéricos ─────────────────────────────────────────

/** Valida que un string no sea nulo/vacío después de trim. Retorna error o null. */
export function validateRequiredString(
  value: unknown,
  label: string
): string | null {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return `${label} es obligatorio.`;
  }
  return null;
}

/** Valida longitud máxima. */
export function validateMaxLength(
  value: string,
  max: number,
  label: string
): string | null {
  if (value.length > max) {
    return `${label} no puede exceder ${max} caracteres.`;
  }
  return null;
}

// ─── Validadores específicos ───────────────────────────────────────

/** Valida formato de email con regex. Retorna error o null. */
export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email.trim())) {
    return "El formato del correo electrónico no es válido.";
  }
  return null;
}

/** Valida que una contraseña cumpla todos los requisitos del sistema. */
export function validatePasswordRule(password: string): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (/\s/.test(password)) {
    return "La contraseña no puede contener espacios en blanco.";
  }
  return null;
}

/** Valida formato de UUID v4. */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** Valida formato de nombre de usuario (alfanumérico + guiones + puntos). */
export function validateUsername(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).";
  }
  if (username.length > MAX_USUARIO) {
    return `El nombre de usuario no puede exceder ${MAX_USUARIO} caracteres.`;
  }
  return null;
}
