import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, DataResponse } from "./common";

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

/** Entrada para crear una o varias copias de un libro. */
export interface CreateCopiasInput extends Omit<
  InsertCopiaPayload,
  "id_tienda"
> {
  cantidad: number;
  id_tienda?: string;
}

/** IDs de copia admitidos para operaciones unitarias o masivas. */
export type OneOrManyCopyIds = string | string[];

/** Entrada para trasladar una o varias copias a otra tienda. */
export interface TransferCopiasInput {
  ids: OneOrManyCopyIds;
  id_tienda: string;
}

/** Entrada para eliminar lógicamente una o varias copias. */
export interface DeleteCopiasInput {
  ids: OneOrManyCopyIds;
}

/** Copia enriquecida con el nombre de la tienda. */
export interface CopiaWithStoreName extends CopiaRow {
  tienda_nombre: string | null;
}

export interface CopiasGroupedByLibro {
  id_libro: string;
  copias: OneOrManyCopyIds;
}

/** Respuesta de mutación de copias (crear/trasladar/eliminar). */
export type CopiaActionResponse = ActionResponse;

/** Respuesta de lectura de una copia con datos adicionales. */
export type CopiaDataResponse = DataResponse<CopiaWithStoreName>;
