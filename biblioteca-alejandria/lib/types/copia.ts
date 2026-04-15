import type { Database } from "@/lib/types/supabase";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `copia` (lectura). */
export type CopiaRow = Database["public"]["Tables"]["copia"]["Row"];

// ─── Enums ─────────────────────────────────────────────────────────

/** Estado de la copia: "disponible" | "vendido" | "reservado". */
export type EstadoCopia = Database["public"]["Enums"]["estado_copia"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear una nueva copia. */
export interface InsertCopiaPayload {
  id_libro: string;
  id_tienda: string;
  estado: EstadoCopia;
}

/** Payload para actualizar el estado de una copia. */
export interface UpdateCopiaPayload {
  estado?: EstadoCopia;
  id_tienda?: string;
}
