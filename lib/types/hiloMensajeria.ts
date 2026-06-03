import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, DataResponse, Paginated } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `hilo_mensajeria` (lectura). */
export type HiloMensajeriaRow = Database["public"]["Tables"]["hilo_mensajeria"]["Row"];

/** Payload para insertar un nuevo hilo. */
export type InsertHiloMensajeriaPayload = Database["public"]["Tables"]["hilo_mensajeria"]["Insert"];

/** Payload para actualizar un hilo existente. */
export type UpdateHiloMensajeriaPayload = Database["public"]["Tables"]["hilo_mensajeria"]["Update"];

/** Estado del hilo. */
export type EstadoHilo = Database["public"]["Enums"]["estado_hilo"];

// ─── Tipos con datos derivados ──────────────────────────────────────

/** Datos del usuario asociado a un hilo. */
export interface HiloUsuarioInfo {
  nombres: string | null;
  apellidos: string | null;
}

/** Respuesta resumida para mostrar en listados. */
export interface UltimaRespuestaInfo {
  mensaje: string;
  fecha_creacion: string;
  es_admin: boolean;
}

/** Item de hilo para listados (con conteo y última respuesta). */
export interface HiloListItem {
  id: string;
  titulo: string;
  mensaje: string;
  estado: EstadoHilo;
  fecha_creacion: string;
  id_usuario: string | null;
  total_respuestas: number;
  ultima_respuesta: UltimaRespuestaInfo | null;
  tiene_nuevo_mensaje: boolean;
  usuario: HiloUsuarioInfo | null;
}

/** Hilo completo con todas sus respuestas. */
export interface HiloWithRespuestas {
  id: string;
  titulo: string;
  mensaje: string;
  estado: EstadoHilo;
  fecha_creacion: string;
  id_usuario: string | null;
  usuario: HiloUsuarioInfo | null;
  respuestas: RespuestaEnHilo[];
}

/** Respuesta dentro de un hilo (con datos del autor). */
export interface RespuestaEnHilo {
  id: string;
  mensaje: string;
  fecha_creacion: string;
  id_usuario: string | null;
  autor_nombre: string;
  es_admin: boolean;
}

/** Estadísticas de hilos. */
export interface HiloStats {
  total: number;
  abiertos: number;
  cerrados: number;
  no_leidos: number;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de mutación de hilo. */
export type HiloActionResponse = ActionResponse;

/** Respuesta de lectura de un hilo con respuestas. */
export type HiloDataResponse = DataResponse<HiloWithRespuestas>;

/** Respuesta paginada de hilos. */
export type HilosPaginadosResponse = DataResponse<Paginated<HiloListItem>>;

/** Respuesta de estadísticas. */
export type HiloStatsResponse = DataResponse<HiloStats>;
