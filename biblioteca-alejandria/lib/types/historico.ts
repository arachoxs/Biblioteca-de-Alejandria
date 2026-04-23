import type { Database } from "@/lib/types/supabase";
import type { DataResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `historico` (lectura). */
export type HistoricoRow = Database["public"]["Tables"]["historico"]["Row"];

// ─── Enums ─────────────────────────────────────────────────────────

/** Estado histórico de un libro: "agotado" | "disponible". */
export type EstadoHistorico = Database["public"]["Enums"]["estado_historico"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/**
 * Payload para insertar un registro en la tabla de histórico.
 * No hay Update — esta tabla es append-only (log de cambios de estado).
 */
export interface InsertHistoricoPayload {
  id_libro: string;
  estado: EstadoHistorico;
  fecha: string;
}

export interface HistoricoTimelineSegment {
  estado: EstadoHistorico;
  start_at: string;
  end_at: string;
  duration_ms: number;
}

export interface HistoricoTimelineData {
  id_libro: string;
  timeline_start_at: string;
  timeline_end_at: string;
  segments: HistoricoTimelineSegment[];
}

export type HistoricoTimelineResponse = DataResponse<HistoricoTimelineData>;
