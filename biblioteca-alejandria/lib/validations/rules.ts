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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const USERNAME_REGEX = /^[a-zA-Z0-9.-]+$/;
const DNI_REGEX = /^[A-Za-z0-9]+$/;

// ─── Tipo base para reglas atómicas ────────────────────────────────

export type ValidationRule = (value: unknown) => string | null;

// ─── Helper para componer validaciones ─────────────────────────────

/**
 * Ejecuta una lista de reglas de validación en orden.
 * Retorna el primer error encontrado o null si todas pasan.
 */
export function validateFieldRules(
  value: unknown,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

// ─── Reglas atómicas (factories) ───────────────────────────────────

/** Regla: campo requerido (no vacío después de trim). */
export function requiredRule(label: string): ValidationRule {
  return (value: unknown) => {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return `${label} es obligatorio.`;
    }
    return null;
  };
}

/** Regla: contraseña requerida (mensaje específico para espacios). */
export function requiredPasswordRule(): ValidationRule {
  return (value: unknown) => {
    if (!value) {
      return "La contraseña es obligatoria.";
    }
    if (typeof value === "string" && value.trim() === "") {
      return "La contraseña no puede contener espacios.";
    }
    return null;
  };
}

/** Regla: longitud máxima de string. */
export function maxLengthRule(max: number, label: string): ValidationRule {
  return (value: unknown) => {
    if (typeof value === "string" && value.length > max) {
      return `${label} no puede exceder ${max} caracteres.`;
    }
    return null;
  };
}

/** Regla: longitud mínima de string. */
export function minLengthRule(min: number, label: string): ValidationRule {
  return (value: unknown) => {
    if (typeof value === "string" && value.length < min) {
      return `${label} debe tener al menos ${min} caracteres.`;
    }
    return null;
  };
}

/** Regla: formato de email válido. */
export function emailRule(): ValidationRule {
  return (value: unknown) => {
    if (typeof value === "string" && value.trim() && !EMAIL_REGEX.test(value.trim())) {
      return "El formato del correo electrónico no es válido.";
    }
    return null;
  };
}

/** Regla: contraseña válida (min 8, max 128, sin espacios). */
export function passwordRule(): ValidationRule {
  return (value: unknown) => {
    if (typeof value !== "string" || !value) return null;
    if (value.length < PASSWORD_MIN_LENGTH) {
      return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }
    if (value.length > PASSWORD_MAX_LENGTH) {
      return `La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres.`;
    }
    if (/\s/.test(value)) {
      return "La contraseña no puede contener espacios en blanco.";
    }
    return null;
  };
}

/** Regla: DNI válido (5-20 caracteres alfanuméricos). */
export function dniRule(): ValidationRule {
  return (value: unknown) => {
    if (typeof value !== "string") return null;
    // Vacío completo → dejar que requiredRule lo maneje
    if (value === "") return null;
    // Solo espacios → error específico
    const trimmed = value.trim();
    if (trimmed === "") {
      return "El documento no puede contener solo espacios.";
    }
    // Validar formato
    if (trimmed.length < MIN_DNI || trimmed.length > MAX_DNI || !DNI_REGEX.test(trimmed)) {
      return `El documento debe tener entre ${MIN_DNI} y ${MAX_DNI} caracteres alfanuméricos.`;
    }
    return null;
  };
}

/** Regla: nombre de usuario válido (alfanumérico + guiones + puntos). */
export function usernameRule(): ValidationRule {
  return (value: unknown) => {
    if (typeof value !== "string") return null;
    // Vacío completo → dejar que requiredRule lo maneje
    if (value === "") return null;
    // Solo espacios → error específico
    const trimmed = value.trim();
    if (trimmed === "") {
      return "El nombre de usuario no puede contener solo espacios.";
    }
    // Validar formato
    if (!USERNAME_REGEX.test(trimmed)) {
      return "El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).";
    }
    if (trimmed.length > MAX_USUARIO) {
      return `El nombre de usuario no puede exceder ${MAX_USUARIO} caracteres.`;
    }
    return null;
  };
}

/** Regla: edad dentro de rango (calcula desde fecha de nacimiento). */
export function ageRule(minAge: number, maxAge: number): ValidationRule {
  return (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return null;
    
    const fechaSeleccionada = new Date(value);
    if (Number.isNaN(fechaSeleccionada.getTime())) {
      return "La fecha de nacimiento no es válida.";
    }

    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
    const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())) {
      edad--;
    }

    if (fechaSeleccionada > hoy) {
      return "No puedes haber nacido en el futuro.";
    }
    if (edad < minAge) {
      return `Debes tener al menos ${minAge} años.`;
    }
    if (edad > maxAge) {
      return `La edad máxima permitida es ${maxAge} años.`;
    }
    return null;
  };
}

/** Regla: valor debe coincidir con otro (útil para confirmación de contraseña). */
export function matchRule(getOtherValue: () => unknown, errorMsg: string): ValidationRule {
  return (value: unknown) => {
    const other = getOtherValue();
    if (value && other && value !== other) {
      return errorMsg;
    }
    return null;
  };
}

/** Regla: campo no debe contener solo espacios en blanco. */
export function notBlankRule(label: string): ValidationRule {
  return (value: unknown) => {
    if (typeof value === "string" && value !== "" && value.trim() === "") {
      return `El campo ${label} no puede estar vacío.`;
    }
    return null;
  };
}

/** Regla: dirección debe tener place_id de Google Places. */
export function placeIdRequiredRule(): ValidationRule {
  return (value: unknown) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return "Por favor selecciona una dirección válida de las sugerencias.";
    }
    return null;
  };
}

// ─── Utilidades de sanitización ────────────────────────────────────

/** Trim + colapsar espacios múltiples internos. */
export function sanitizeText(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

// ─── Validadores legacy (wrappers para compatibilidad con servidor) ─

/** @deprecated Usar requiredRule(label) en su lugar */
export function validateRequiredString(value: unknown, label: string): string | null {
  return requiredRule(label)(value);
}

/** @deprecated Usar maxLengthRule(max, label) en su lugar */
export function validateMaxLength(value: string, max: number, label: string): string | null {
  return maxLengthRule(max, label)(value);
}

/** @deprecated Usar emailRule() en su lugar */
export function validateEmail(email: string): string | null {
  const rule = emailRule();
  const result = rule(email);
  // emailRule retorna null si el email está vacío; validateEmail original siempre validaba
  if (!email.trim()) return "El formato del correo electrónico no es válido.";
  return result;
}

/** @deprecated Usar passwordRule() en su lugar */
export function validatePasswordRule(password: string): string | null {
  // passwordRule retorna null si está vacío, pero validatePasswordRule original lo marcaba como error
  if (!password) return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  return passwordRule()(password);
}

/** Valida formato de UUID v4. */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/** @deprecated Usar usernameRule() en su lugar */
export function validateUsername(username: string): string | null {
  return usernameRule()(username);
}
