import type { ActionResponse, DataResponse } from "./common";
import type { Database, Json } from "@/lib/types/supabase";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `modelo_ra` (lectura). */
export type ModeloRARow = Database["public"]["Tables"]["modelo_ra"]["Row"];

/** Estructura de dimensiones físicas para modelo RA. */
export interface ModeloRADimensiones extends Record<string, Json> {
  ancho: number;
  alto: number;
  profundidad: number;
}

/** Estructura de texturas por cara del libro. */
export interface ModeloRATexturasLibro extends Record<string, Json> {
  portada: string | null;
  contraportada: string | null;
  lomo: string | null;
}

/** Colección de texturas (tipo legacy, array de objetos). */
export type ModeloRATexturasArray = Record<string, Json>[];

// ─── Constantes ────────────────────────────────────────────────────

/** Dimensiones genéricas por defecto (en cm). */
export const DEFAULT_ANCHO = 17;
export const DEFAULT_ALTO = 24;

/** Coeficiente para calcular profundidad a partir de páginas. */
export const PROFUNDIDAD_COEFFICIENT = 0.007;

/** Profundidad mínima en cm. */
export const PROFUNDIDAD_MINIMA = 0.1;

/**
 * Calcula la profundidad del libro en centímetros en función del número de páginas.
 * Fórmula: profundidad = paginas × 0.007 (papel estándar 80gsm, tapa dura).
 */
export function calculateProfundidad(paginas: number): number {
  const raw = paginas * PROFUNDIDAD_COEFFICIENT;
  return Math.round(Math.max(raw, PROFUNDIDAD_MINIMA) * 100) / 100;
}

/** Genera texturas por defecto (todas null → se renderizan como blanco). */
export function createDefaultTexturas(): ModeloRATexturasLibro {
  return {
    portada: null,
    contraportada: null,
    lomo: null,
  };
}

/** Genera dimensiones por defecto dada una cantidad de páginas. */
export function createDefaultDimensiones(paginas: number): ModeloRADimensiones {
  return {
    ancho: DEFAULT_ANCHO,
    alto: DEFAULT_ALTO,
    profundidad: calculateProfundidad(paginas),
  };
}

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear un nuevo modelo RA. */
export interface InsertModeloRAPayload {
  dimensiones: ModeloRADimensiones;
  texturas: ModeloRATexturasLibro;
}

/** Payload para actualizar un modelo RA existente. */
export interface UpdateModeloRAPayload {
  dimensiones?: ModeloRADimensiones;
  texturas?: ModeloRATexturasLibro;
}

// ─── Respuestas de Service/Server Actions ───────────────────────────

/** Respuesta estándar para mutaciones de modelo RA. */
export type ModeloRAActionResponse = ActionResponse;

/** Respuesta de lectura individual de modelo RA. */
export type ModeloRADataResponse = DataResponse<ModeloRARow>;
