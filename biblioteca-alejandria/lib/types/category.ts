import type { Database } from "@/lib/types/supabase";

/** Fila de la tabla `categoria`. */
export type CategoryRow = Database["public"]["Tables"]["categoria"]["Row"];

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

