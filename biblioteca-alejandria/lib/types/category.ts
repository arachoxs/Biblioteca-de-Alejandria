import type { Database } from "@/lib/types/supabase";

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
