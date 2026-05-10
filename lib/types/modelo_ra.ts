import type { ActionResponse, DataResponse } from "./common";
import type { Database, Json } from "@/lib/types/supabase";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `modelo_ra` (lectura). */
export type ModeloRARow = Database["public"]["Tables"]["modelo_ra"]["Row"];

/** Estructura de dimensiones físicas para modelo RA. */
export interface ModeloRADimensiones extends Record<string, Json> {
  alto: number;
  ancho: number;
  profundidad: number;
}

/** Estructura JSON abierta por imagen/textura. */
export type ModeloRATextura = Record<string, Json>;

/** Colección de texturas/imágenes del modelo RA. */
export type ModeloRATexturas = ModeloRATextura[];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear un nuevo modelo RA. */
export interface InsertModeloRAPayload {
  dimensiones: ModeloRADimensiones;
  texturas: ModeloRATexturas;
}

/** Payload para actualizar un modelo RA existente. */
export interface UpdateModeloRAPayload {
  dimensiones?: ModeloRADimensiones;
  texturas?: ModeloRATexturas;
}

// ─── Respuestas de Service/Server Actions ───────────────────────────

/** Respuesta estándar para mutaciones de modelo RA. */
export type ModeloRAActionResponse = ActionResponse;

/** Respuesta de lectura individual de modelo RA. */
export type ModeloRADataResponse = DataResponse<ModeloRARow>;
