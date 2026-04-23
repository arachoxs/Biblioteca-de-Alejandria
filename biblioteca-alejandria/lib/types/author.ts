import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `autor` (lectura). */
export type AuthorRow = Database["public"]["Tables"]["autor"]["Row"];

// ─── Tipos con datos derivados ─────────────────────────────────────

/** Autor con la cantidad de libros asociados (para listados). */
export interface AuthorWithBookCount extends AuthorRow {
  libro_count: number;
}

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear un nuevo autor. */
export interface InsertAuthorPayload {
  nombre: string;
  nacionalidad: string;
  fecha_nacimiento: string;
}

/** Payload para actualizar un autor existente. */
export interface UpdateAuthorPayload {
  nombre: string;
  nacionalidad: string;
  fecha_nacimiento: string;
}

// ─── Valores del formulario (frontend) ─────────────────────────────

/** Estado del formulario de creación/edición de autor. */
export type AuthorFormValues = {
  nombre: string;
  nacionalidad: string;
  fecha_nacimiento: string;
};

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de autores paginada. */
export type AuthorsListResponse = PaginatedResponse<AuthorWithBookCount>;

/** Respuesta de mutación de autor (crear/editar/eliminar). */
export interface AuthorActionResponse extends ActionResponse {
  id?: number | string;
}
