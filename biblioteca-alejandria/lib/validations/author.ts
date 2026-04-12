import {
  requiredRule,
  maxLengthRule,
  validateFieldRules,
} from "./rules";

export interface AuthorValidationPayload {
  nombre: string;
  nacionalidad: string;
  fecha_nacimiento: string;
}

// Fecha mínima razonable: autores históricos más remotos (~700 años A.D.)
const MIN_BIRTH_YEAR = 700;

/**
 * Valida los datos de un autor tanto para cliente como para servidor.
 * Las reglas de fecha son centralizadas aquí (no en el modelo).
 */
export function validateAuthor(payload: AuthorValidationPayload): Record<string, string> {
  const errors: Record<string, string> = {};

  const nombreError = validateFieldRules(payload.nombre, [
    requiredRule("Nombre"),
    maxLengthRule(200, "Nombre"),
  ]);
  if (nombreError) errors.nombre = nombreError;

  const nacionalidadError = validateFieldRules(payload.nacionalidad, [
    requiredRule("Nacionalidad"),
    maxLengthRule(100, "Nacionalidad"),
  ]);
  if (nacionalidadError) errors.nacionalidad = nacionalidadError;

  // Validación de fecha: requerida + formato + rango histórico-razonable
  const fechaReq = validateFieldRules(payload.fecha_nacimiento, [
    requiredRule("Fecha de nacimiento"),
  ]);

  if (fechaReq) {
    errors.fecha_nacimiento = fechaReq;
  } else {
    const date = new Date(payload.fecha_nacimiento);

    if (isNaN(date.getTime())) {
      errors.fecha_nacimiento = "La fecha de nacimiento no es válida.";
    } else if (date > new Date()) {
      errors.fecha_nacimiento = "La fecha de nacimiento no puede ser en el futuro.";
    } else if (date.getFullYear() < MIN_BIRTH_YEAR) {
      errors.fecha_nacimiento = `El año de nacimiento no puede ser anterior a ${MIN_BIRTH_YEAR}.`;
    }
  }

  return errors;
}
