import type { Database, Json } from "@/lib/types/supabase";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `modelo_ra` (lectura). */
export type ModeloRARow = Database["public"]["Tables"]["modelo_ra"]["Row"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear un nuevo modelo RA. */
export interface InsertModeloRAPayload {
  dimensiones: Json;
  texturas: Json;
}

/** Payload para actualizar un modelo RA existente. */
export interface UpdateModeloRAPayload {
  dimensiones?: Json;
  texturas?: Json;
}
