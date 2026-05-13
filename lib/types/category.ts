import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

/** Fila de la tabla `categoria`. */
export type CategoryRow = Database["public"]["Tables"]["categoria"]["Row"];

// ─── Domain types (eliminate primitive obsession) ─────────────────────

/** ID de categoría — previene confusión con otros IDs numéricos */
export type CategoryId = number & { readonly __brand: "CategoryId" };
export function asCategoryId(id: number): CategoryId {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid CategoryId: ${id}`);
  }
  return id as CategoryId;
}

/** Nombre de categoría */
export type CategoryName = string & { readonly __brand: "CategoryName" };
export function asCategoryName(name: string): CategoryName {
  return name as CategoryName;
}

/** Parámetros de paginación para listados */
export interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
}

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

/** Respuesta de mutación de categoría (crear/editar/eliminar). */
export interface CategoryActionResponse extends ActionResponse {
  id?: number | string;
}

