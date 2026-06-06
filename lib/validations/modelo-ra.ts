import type {
  InsertModeloRAPayload,
  ModeloRADimensiones,
  ModeloRATexturasLibro,
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
  return "ancho" in value && "alto" in value && "profundidad" in value;
}

function isModeloRATexturasLibro(value: unknown): value is ModeloRATexturasLibro {
  if (!isPlainObject(value)) return false;
  return "portada" in value && "contraportada" in value && "lomo" in value;
}

function isInRange(value: unknown, min: number, max: number): boolean {
  return isPositiveNumber(value) && value >= min && value <= max;
}

function validateDimensionRange(
  value: unknown,
  min: number,
  max: number,
  label: string,
): string | null {
  if (!isInRange(value, min, max)) {
    return `El ${label} debe ser un número entre ${min} y ${max} cm.`;
  }
  return null;
}

function validateDimensiones(
  dimensiones: ModeloRADimensiones,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const anchoErr = validateDimensionRange(dimensiones.ancho, 5, 50, "ancho");
  if (anchoErr) errors.dimensiones_ancho = anchoErr;

  const altoErr = validateDimensionRange(dimensiones.alto, 5, 50, "alto");
  if (altoErr) errors.dimensiones_alto = altoErr;

  const profErr = validateDimensionRange(dimensiones.profundidad, 0.1, 20, "profundidad");
  if (profErr) errors.dimensiones_profundidad = profErr;

  return errors;
}

function validateTexturas(texturas: ModeloRATexturasLibro): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isModeloRATexturasLibro(texturas)) {
    errors.texturas = "Las texturas deben ser un objeto con campos portada, contraportada y lomo.";
    return errors;
  }

  const allowedKeys = ["portada", "contraportada", "lomo"] as const;
  for (const key of allowedKeys) {
    const value = texturas[key];
    if (value !== null && typeof value !== "string") {
      errors[`texturas_${key}`] = `La textura "${key}" debe ser una URL (string) o null.`;
    }
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
    errors.dimensiones = "Las dimensiones deben enviarse como un objeto JSON válido.";
  } else {
    Object.assign(errors, validateDimensiones(payload.dimensiones));
  }
  Object.assign(errors, validateTexturas(payload.texturas));

  return errors;
}

/**
 * Valida payload parcial para actualizar un modelo RA.
 */
function validateOptionalDimensiones(
  dimensiones: ModeloRADimensiones | undefined,
): Record<string, string> {
  if (dimensiones === undefined) return {};
  if (!isModeloRADimensiones(dimensiones)) {
    return { dimensiones: "Las dimensiones deben enviarse como un objeto con ancho, alto y profundidad." };
  }
  return validateDimensiones(dimensiones);
}

function validateOptionalTexturas(
  texturas: ModeloRATexturasLibro | undefined,
): Record<string, string> {
  if (texturas === undefined) return {};
  if (!isModeloRATexturasLibro(texturas)) {
    return { texturas: "Las texturas deben enviarse como un objeto con portada, contraportada y lomo." };
  }
  return validateTexturas(texturas);
}

export function validateModeloRAUpdate(
  payload: UpdateModeloRAPayload,
): Record<string, string> {
  if (payload.dimensiones === undefined && payload.texturas === undefined) {
    return { form: "Debes enviar al menos un campo para actualizar." };
  }

  return {
    ...validateOptionalDimensiones(payload.dimensiones),
    ...validateOptionalTexturas(payload.texturas),
  };
}
