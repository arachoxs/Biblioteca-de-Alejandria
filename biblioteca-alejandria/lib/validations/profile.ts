import {
  sanitizeText,
  validateRequiredString,
  validateMaxLength,
  validateUsername,
  MAX_NOMBRE,
  MAX_APELLIDO,
  MAX_USUARIO,
  MAX_DNI,
  MIN_DNI,
  MAX_DIRECCION_DETALLE,
} from "./auth";

import type { ProfileFieldsPayload, ProfileValidationResult } from "@/lib/types/profile";


/**
 * Versión completa que retorna tanto errores como datos sanitizados.
 */
export function validateAndSanitizeProfile(
  payload: ProfileFieldsPayload,
  options: { requireDni?: boolean } = {}
): ProfileValidationResult {
  const errors: Record<string, string> = {};
  const { requireDni = false } = options;

  // Sanitizar todos los campos de texto
  const sanitized: ProfileFieldsPayload = {
    ...payload,
    dni: payload.dni ? sanitizeText(payload.dni) : payload.dni,
    nombres: sanitizeText(payload.nombres),
    apellidos: sanitizeText(payload.apellidos),
    fecha_nacimiento: payload.fecha_nacimiento?.trim() ?? "",
    lugar_nacimiento: sanitizeText(payload.lugar_nacimiento),
    genero: payload.genero,
    usuario: payload.usuario?.trim() ?? "",
    direccion: sanitizeText(payload.direccion),
    direccion_place_id: payload.direccion_place_id?.trim(),
    direccion_detalle: payload.direccion_detalle
      ? sanitizeText(payload.direccion_detalle)
      : payload.direccion_detalle,
  };

  // Campos obligatorios
  const required: { key: keyof ProfileFieldsPayload; label: string; max?: number }[] = [
    { key: "nombres", label: "Nombres", max: MAX_NOMBRE },
    { key: "apellidos", label: "Apellidos", max: MAX_APELLIDO },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
    { key: "lugar_nacimiento", label: "Lugar de nacimiento" },
    { key: "genero", label: "Género" },
    { key: "usuario", label: "Nombre de usuario", max: MAX_USUARIO },
    { key: "direccion", label: "Dirección" },
  ];

  if (requireDni) {
    required.unshift({ key: "dni", label: "DNI", max: MAX_DNI });
  }

  for (const { key, label, max } of required) {
    const value = sanitized[key];
    const reqError = validateRequiredString(value, label);
    if (reqError) {
      errors[key] = reqError;
    } else if (max && typeof value === "string") {
      const lenError = validateMaxLength(value, max, label);
      if (lenError) errors[key] = lenError;
    }
  }

  // Validar formato del DNI
  if (!errors.dni && sanitized.dni) {
    const dniStr = sanitized.dni;
    const dniRegex = /^[A-Za-z0-9]{5,20}$/;
    if (dniStr.length < MIN_DNI || !dniRegex.test(dniStr)) {
      errors.dni = `El documento debe tener entre ${MIN_DNI} y ${MAX_DNI} caracteres alfanuméricos.`;
    }
  }

  // Validar formato del username
  if (!errors.usuario && sanitized.usuario) {
    const usernameError = validateUsername(sanitized.usuario);
    if (usernameError) errors.usuario = usernameError;
  }

  // Validar dirección detalle (longitud máxima, campo opcional)
  if (sanitized.direccion_detalle) {
    const detError = validateMaxLength(
      sanitized.direccion_detalle,
      MAX_DIRECCION_DETALLE,
      "Detalle de la dirección"
    );
    if (detError) errors.direccion_detalle = detError;
  }

  // Validar fecha de nacimiento
  if (!errors.fecha_nacimiento) {
    const fechaSeleccionada = new Date(sanitized.fecha_nacimiento);
    const hoy = new Date();

    if (Number.isNaN(fechaSeleccionada.getTime())) {
      errors.fecha_nacimiento = "La fecha de nacimiento no es válida.";
    } else {
      let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
      const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

      if (
        diferenciaMeses < 0 ||
        (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())
      ) {
        edad--;
      }

      if (fechaSeleccionada > hoy) {
        errors.fecha_nacimiento = "No puedes haber nacido en el futuro.";
      } else if (edad < 18) {
        errors.fecha_nacimiento = "Debes tener al menos 18 años.";
      } else if (edad > 80) {
        errors.fecha_nacimiento = "La edad máxima permitida es 80 años.";
      }
    }
  }

  // Validar dirección con Google Places
  if (!errors.direccion && !sanitized.direccion_place_id) {
    errors.direccion =
      "Por favor selecciona una dirección válida de las sugerencias.";
  }

  return { errors, sanitized };
}
