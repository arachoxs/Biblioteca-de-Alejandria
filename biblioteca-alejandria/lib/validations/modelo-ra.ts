import type {
  InsertModeloRAPayload,
  ModeloRADimensiones,
  ModeloRATexturas,
  UpdateModeloRAPayload,
} from "@/lib/types/modelo_ra";

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isModeloRADimensiones(value: unknown): value is ModeloRADimensiones {
  if (!isPlainObject(value)) return false;
  return "alto" in value && "ancho" in value && "profundidad" in value;
}

function isModeloRATexturas(value: unknown): value is ModeloRATexturas {
  return Array.isArray(value) && value.every((item) => isPlainObject(item));
}

function validateDimensiones(
  dimensiones: ModeloRADimensiones,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isPositiveNumber(dimensiones.alto)) {
    errors.dimensiones_alto = "La dimensión alto debe ser un número positivo.";
  }

  if (!isPositiveNumber(dimensiones.ancho)) {
    errors.dimensiones_ancho = "La dimensión ancho debe ser un número positivo.";
  }

  if (!isPositiveNumber(dimensiones.profundidad)) {
    errors.dimensiones_profundidad =
      "La dimensión profundidad debe ser un número positivo.";
  }

  return errors;
}

function validateTexturas(texturas: ModeloRATexturas): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!Array.isArray(texturas)) {
    errors.texturas = "Las texturas deben enviarse como un arreglo JSON.";
    return errors;
  }

  if (texturas.length === 0) {
    errors.texturas = "Debes enviar al menos una imagen en texturas.";
    return errors;
  }

  const hasInvalidItem = texturas.some(
    (item) => !isPlainObject(item) || Object.keys(item).length === 0,
  );

  if (hasInvalidItem) {
    errors.texturas =
      "Cada textura debe ser un objeto JSON no vacío dentro del arreglo.";
  }

  return errors;
}

/**
 * Valida payload completo para crear un modelo RA.
 */
export function validateModeloRACreate(
  payload: InsertModeloRAPayload,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isModeloRADimensiones(payload.dimensiones)) {
    errors.dimensiones =
      "Las dimensiones deben enviarse como un objeto JSON válido.";
  } else {
    Object.assign(errors, validateDimensiones(payload.dimensiones));
  }
  Object.assign(errors, validateTexturas(payload.texturas));

  return errors;
}

/**
 * Valida payload parcial para actualizar un modelo RA.
 */
export function validateModeloRAUpdate(
  payload: UpdateModeloRAPayload,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const hasDimensiones = payload.dimensiones !== undefined;
  const hasTexturas = payload.texturas !== undefined;

  if (!hasDimensiones && !hasTexturas) {
    errors.form = "Debes enviar al menos un campo para actualizar.";
    return errors;
  }

  if (hasDimensiones) {
    const { dimensiones } = payload;
    if (!isModeloRADimensiones(dimensiones)) {
      errors.dimensiones =
        "Las dimensiones deben enviarse como un objeto con alto, ancho y profundidad.";
    } else {
      Object.assign(errors, validateDimensiones(dimensiones));
    }
  }

  if (hasTexturas) {
    const { texturas } = payload;
    if (!isModeloRATexturas(texturas)) {
      errors.texturas = "Las texturas deben enviarse como un arreglo JSON.";
    } else {
      Object.assign(errors, validateTexturas(texturas));
    }
  }

  return errors;
}
