import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `tienda` (lectura). */
export type TiendaRow = Database["public"]["Tables"]["tienda"]["Row"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear una nueva tienda. */
export interface InsertTiendaPayload {
  nombre: string;
  horario: TiendaHorario;
  id_direccion: number;
}

/** Payload para actualizar una tienda existente. */
export interface UpdateTiendaPayload {
  nombre?: string;
  horario?: TiendaHorario;
  id_direccion?: number;
}

// ─── Tipos auxiliares ──────────────────────────────────────────────

/**
 * Estructura tipada del campo `horario` (almacenado como JSON en BD).
 * Cada día contiene un rango horario o `null` si la tienda no abre.
 */
export interface TiendaHorario {
  lunes: RangoHorario | null;
  martes: RangoHorario | null;
  miercoles: RangoHorario | null;
  jueves: RangoHorario | null;
  viernes: RangoHorario | null;
  sabado: RangoHorario | null;
  domingo: RangoHorario | null;
}

export interface RangoHorario {
  apertura: string;
  cierre: string;
}

// ─── Tipos con datos derivados ─────────────────────────────────────

/** Fila de tienda para lectura con `horario` fuertemente tipado. */
export type TiendaRead = Omit<TiendaRow, "horario"> & {
  horario: TiendaHorario;
};

/** Tienda con la dirección formateada (para listados). */
export interface TiendaWithDireccion extends TiendaRead {
  direccion_formateada: string;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de tiendas paginada. */
export type TiendasListResponse = PaginatedResponse<TiendaWithDireccion>;

/** Respuesta de mutación de tienda (crear/editar/eliminar). */
export type TiendaActionResponse = ActionResponse;
