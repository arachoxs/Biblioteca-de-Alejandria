import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `noticias` (lectura). */
export type NoticiaRow = Database["public"]["Tables"]["noticias"]["Row"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear una nueva noticia. */
export interface InsertNoticiaPayload {
  fecha_publicacion: string;
  es_visible: boolean;
  id_libro?: string | null;
}

/** Payload para actualizar una noticia existente. */
export interface UpdateNoticiaPayload {
  fecha_publicacion?: string;
  es_visible?: boolean;
  id_libro?: string | null;
}

// ─── Tipos con datos derivados ─────────────────────────────────────

/** Noticia con el título del libro asociado (para listados). */
export interface NoticiaWithLibro extends NoticiaRow {
  libro_titulo: string | null;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de noticias paginada. */
export type NoticiasListResponse = PaginatedResponse<NoticiaWithLibro>;

/** Respuesta de mutación de noticia (crear/editar/eliminar). */
export type NoticiaActionResponse = ActionResponse;
