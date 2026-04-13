import { requiredRule, validateFieldRules } from "./rules";

export interface CategoryValidationPayload {
  nombre: string;
}

/**
 * Valida los datos de una categoría (cliente/servidor).
 * La sanitización se realiza fuera de este módulo usando utilidades comunes.
 */
export function validateCategory(
  payload: CategoryValidationPayload,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const nombreError = validateFieldRules(payload.nombre, [
    requiredRule("El nombre de la categoría"),
  ]);

  if (nombreError) {
    errors.nombre = nombreError;
  }

  return errors;
}
