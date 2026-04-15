import type { Database } from "@/lib/types/supabase";

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
