import type { Database } from "@/lib/types/supabase";
import type { EstadoCopia } from "@/lib/types/copia";
import type { ActionResponse, DataResponse } from "./common";

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
    autor: { nombre: string } | null;
  } | null;
  tienda: {
    id: string;
    nombre: string;
  } | null;
}

/** Item de reserva agrupado por libro para la vista del usuario. */
export interface ReservaAgrupadaItem {
  id_libro: string;
  titulo: string;
  isbn: string;
  precio: number;
  autor_nombre: string | null;
  copias_reservadas: number;
  fecha_expiracion_mas_cercana: string;
  reservas: Array<{
    id_reserva: string;
    id_copia: string;
    codigo_seq: string | null;
    nombre_tienda: string | null;
    fecha_expiracion: string;
  }>;
}

/** Respuesta de resumen de reservas agrupadas por libro. */
export type ReservasAgrupadasResponse = DataResponse<ReservaAgrupadaItem[]>;

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

// ─── Tipos para slots disponibles ───────────────────────────────────

/** Información de cuántas copias puede aún reservar el usuario de un libro. */
export interface RemainingSlotsInfo {
  id_libro: string;
  titulo: string;
  autor_nombre: string | null;
  isbn: string;
  precio: number;
  copias_ya_reservadas: number;
  max_por_limite: number;
  disponibles_fisicas: number;
  efectivo: number;
  puede_agregar: boolean;
}

/** Respuesta de consulta de slots disponibles. */
export type RemainingSlotsResponse = DataResponse<RemainingSlotsInfo>;

// ─── Constantes de negocio ─────────────────────────────────────────
// Definidas en lib/validations/rules.ts, re-exportadas aquí para conveniencia.
export { MAX_RESERVAS_DIFERENTES, MAX_RESERVAS_MISMO_LIBRO } from "@/lib/validations/rules";
