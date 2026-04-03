import {
  sanitizeText,
  validateFieldRules,
  requiredRule,
  maxLengthRule,
  dniRule,
  usernameRule,
  ageRule,
  placeIdRequiredRule,
  type ValidationRule,
  MAX_NOMBRE,
  MAX_APELLIDO,
  MAX_DIRECCION_DETALLE,
  generoRule,
} from "./rules";

import type {
  FullProfilePayload,
  FullProfileValidationResult,
  ProfileUpdatePayload,
  ProfileUpdateValidationResult,
} from "@/lib/types/profile";

// ─── Configuración de campos ───────────────────────────────────────

interface FieldConfig {
  label: string;
  rules: ValidationRule[];
  optional?: boolean;
}

// Campos compartidos entre ambas validaciones
const sharedFieldConfigs: Record<string, FieldConfig> = {
  nombres: {
    label: "Nombres",
    rules: [requiredRule("Nombres"), maxLengthRule(MAX_NOMBRE, "Nombres")],
  },
  apellidos: {
    label: "Apellidos",
    rules: [requiredRule("Apellidos"), maxLengthRule(MAX_APELLIDO, "Apellidos")],
  },
  genero: {
    label: "Género",
    rules: [requiredRule("Género"), generoRule()],
  },
  usuario: {
    label: "Nombre de usuario",
    rules: [requiredRule("Nombre de usuario"), usernameRule()],
  },
  direccion: {
    label: "Dirección",
    rules: [requiredRule("Dirección")],
  },
  direccion_detalle: {
    label: "Detalle de la dirección",
    rules: [maxLengthRule(MAX_DIRECCION_DETALLE, "Detalle de la dirección")],
    optional: true,
  },
};

// Campos específicos del perfil completo (registro/onboarding)
const fullProfileOnlyFields: Record<string, FieldConfig> = {
  dni: {
    label: "DNI",
    rules: [requiredRule("DNI"), dniRule()],
  },
  fecha_nacimiento: {
    label: "Fecha de nacimiento",
    rules: [requiredRule("Fecha de nacimiento"), ageRule(18, 80)],
  },
  lugar_nacimiento: {
    label: "Lugar de nacimiento",
    rules: [requiredRule("Lugar de nacimiento")],
  },
};

// ─── Helpers de sanitización ───────────────────────────────────────

function sanitizeFullProfile(payload: FullProfilePayload): FullProfilePayload {
  return {
    dni: sanitizeText(payload.dni),
    nombres: sanitizeText(payload.nombres),
    apellidos: sanitizeText(payload.apellidos),
    fecha_nacimiento: payload.fecha_nacimiento?.trim() ?? "",
    lugar_nacimiento: sanitizeText(payload.lugar_nacimiento),
    genero: payload.genero, 
    usuario: payload.usuario?.trim() ?? "",
    direccion: sanitizeText(payload.direccion),
    direccion_place_id: payload.direccion_place_id?.trim() ?? "",
    direccion_detalle: payload.direccion_detalle
      ? sanitizeText(payload.direccion_detalle)
      : payload.direccion_detalle,
  };
}

function sanitizeProfileUpdate(payload: ProfileUpdatePayload): ProfileUpdatePayload {
  return {
    nombres: sanitizeText(payload.nombres),
    apellidos: sanitizeText(payload.apellidos),
    genero: payload.genero,
    usuario: payload.usuario?.trim() ?? "",
    direccion: sanitizeText(payload.direccion),
    direccion_place_id: payload.direccion_place_id?.trim() ?? "",
    direccion_detalle: payload.direccion_detalle
      ? sanitizeText(payload.direccion_detalle)
      : payload.direccion_detalle,
  };
}

// ─── Helper de validación ──────────────────────────────────────────

function validateFields(
  sanitized: FullProfilePayload | ProfileUpdatePayload,
  fieldConfigs: Record<string, FieldConfig>,
  errors: Record<string, string>
): void {
  for (const [key, config] of Object.entries(fieldConfigs)) {
    const value = (sanitized as unknown as Record<string, unknown>)[key];
    
    // Saltar campos opcionales vacíos
    if (config.optional && !value) continue;
    
    const error = validateFieldRules(value, config.rules);
    if (error) errors[key] = error;
  }
}

// ─── Validación para registro y onboarding ─────────────────────────

/**
 * Valida y sanitiza todos los campos del perfil para registro/onboarding.
 * Incluye campos inmutables: dni, fecha_nacimiento, lugar_nacimiento.
 */
export function validateFullProfile(
  payload: FullProfilePayload
): FullProfileValidationResult {
  const errors: Record<string, string> = {};
  const sanitized = sanitizeFullProfile(payload);

  // Validar campos específicos del perfil completo
  validateFields(sanitized, fullProfileOnlyFields, errors);

  // Validar campos compartidos
  validateFields(sanitized, sharedFieldConfigs, errors);

  // Validar place_id solo si la dirección es válida
  if (!errors.direccion) {
    const placeIdError = validateFieldRules(sanitized.direccion_place_id, [placeIdRequiredRule()]);
    if (placeIdError) errors.direccion = placeIdError;
  }

  return { errors, sanitized };
}

// ─── Validación para actualización de perfil ───────────────────────

/**
 * Valida y sanitiza únicamente los campos editables del perfil.
 * Excluye campos inmutables: dni, fecha_nacimiento, lugar_nacimiento.
 */
export function validateProfileUpdate(
  payload: ProfileUpdatePayload
): ProfileUpdateValidationResult {
  const errors: Record<string, string> = {};
  const sanitized = sanitizeProfileUpdate(payload);

  // Validar solo campos compartidos (editables)
  validateFields(sanitized, sharedFieldConfigs, errors);

  // Validar place_id solo si la dirección es válida
  if (!errors.direccion) {
    const placeIdError = validateFieldRules(sanitized.direccion_place_id, [placeIdRequiredRule()]);
    if (placeIdError) errors.direccion = placeIdError;
  }

  return { errors, sanitized };
}
