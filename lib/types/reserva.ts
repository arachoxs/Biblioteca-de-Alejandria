import type { Database } from "@/lib/types/supabase";
import type { EstadoCopia } from "@/lib/types/copia";
import type { ActionResponse, DataResponse, PaginatedResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `reserva` (lectura). */
export type ReservaRow = Database["public"]["Tables"]["reserva"]["Row"];

/** Payload para insertar una nueva reserva. */
export type InsertReservaPayload = Database["public"]["Tables"]["reserva"]["Insert"];

/** Payload para actualizar una reserva existente (no se usa, es para completitud). */
export type UpdateReservaPayload = Database["public"]["Tables"]["reserva"]["Update"];

// ─── Tipos con datos derivados ──────────────────────────────────────

/** Datos de una copia dentro de una reserva (join copia + libro + tienda). */
export interface ReservaCopiaInfo {
  id: string;
  codigo_seq: string | null;
  estado: EstadoCopia;
  libro: {
    id: string;
    titulo: string;
    isbn: string;
    precio: number;
  } | null;
  tienda: {
    id: string;
    nombre: string;
  } | null;
}

/** Reserva enriquecida con datos de copia, libro y tienda. */
export interface ReservaWithDetails {
  id: string;
  created_at: string;
  fecha_expiracion: string;
  id_copia: string;
  id_usuario: string;
  copia: ReservaCopiaInfo | null;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de mutación de reserva (crear/cancelar). */
export type ReservaActionResponse = ActionResponse;

/** Respuesta de lectura de una reserva con detalles. */
export type ReservaDataResponse = DataResponse<ReservaWithDetails>;

/** Respuesta de listado de reservas paginado. */
export type ReservaListResponse = PaginatedResponse<ReservaWithDetails>;

// ─── Constantes de negocio ─────────────────────────────────────────
// Definidas en lib/validations/rules.ts, re-exportadas aquí para conveniencia.
export { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/validations/rules";
