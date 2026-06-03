import type { Database } from "@/lib/types/supabase";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `respuesta` (lectura). */
export type RespuestaRow = Database["public"]["Tables"]["respuesta"]["Row"];

/** Payload para insertar una nueva respuesta. */
export type InsertRespuestaPayload = Database["public"]["Tables"]["respuesta"]["Insert"];

/** Payload para actualizar una respuesta existente. */
export type UpdateRespuestaPayload = Database["public"]["Tables"]["respuesta"]["Update"];
