import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, DataResponse, PaginatedResponse } from "./common";

/** Fila de la tabla `categoria`. */
export type CategoryRow = Database["public"]["Tables"]["categoria"]["Row"];

/** Categoría con la cantidad de libros asociados (para listados). */
export interface CategoryWithBookCount extends CategoryRow {
  libro_count: number;
}

/** Datos requeridos para crear una categoría. */
export interface CategoryCreateInput {
  nombre: string;
  descripcion?: string | null;
}

/** Campos editables de una categoría existente. */
export interface CategoryUpdateInput {
  nombre?: string;
  descripcion?: string | null;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de categorías paginada. */
export type CategoryListResponse = PaginatedResponse<CategoryWithBookCount>;

/** Respuesta para búsqueda de categorías no paginada. */
export type CategorySearchResponse = DataResponse<CategoryWithBookCount[]>;

/** Respuesta de mutación de categoría (crear/editar/eliminar). */
export type CategoryActionResponse = ActionResponse;

