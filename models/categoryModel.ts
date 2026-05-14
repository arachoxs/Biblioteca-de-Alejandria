import { createAdminClient } from "@/lib/supabase/server";
import type {
  CategoryCreateInput,
  CategoryId,
  CategoryName,
  CategoryRow,
  CategoryWithBookCount,
  CategoryUpdateInput,
  PaginationParams,
} from "@/lib/types/category";
import type { Paginated } from "@/lib/types/common";
import { escapeLikePattern, formatILIKE } from "@/lib/validations/db-utils";
import { asCategoryId, asCategoryName } from "@/lib/types/category";

function buildCategoryQueryOptions(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { safePage, safePageSize, from, to };
}

function applyCategorySearchFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  searchTerm?: string
): typeof query {
  if (!searchTerm || searchTerm.trim() === "") return query;
  const normalizedSearch = formatILIKE(searchTerm);
  return query.ilike("nombre", normalizedSearch);
}

function buildCategoryUpdatePayload(
  input: CategoryUpdateInput
): Partial<Pick<CategoryRow, "nombre" | "descripcion">> {
  const payload: Partial<Pick<CategoryRow, "nombre" | "descripcion">> = {};
  if (input.nombre !== undefined) payload.nombre = input.nombre;
  if (input.descripcion !== undefined) payload.descripcion = input.descripcion;
  return payload;
}

function hasActiveBooks(data: { id: unknown }[] | null): boolean {
  return (data?.length ?? 0) > 0;
}

function normalizeCategoryWithBookCount(
  row: CategoryRow & Record<string, unknown>
): CategoryWithBookCount {
  const libroArr = row.libro as { count: number }[] | undefined;

  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    deleted_at: row.deleted_at,
    libro_count: libroArr?.[0]?.count ?? 0,
  };
}

// ─── Operaciones CRUD (sin validaciones de negocio) ─────────────────

/**
 * Inserta una nueva categoría en la tabla `categoria`.
 */
export async function createCategory(
  input: CategoryCreateInput
): Promise<number> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("categoria")
    .insert({
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error al crear categoría:", error);
    throw error;
  }

  return data.id;
}

/**
 * Obtiene categorías activas paginadas para el panel.
 */
export async function getCategories(
  params: PaginationParams,
): Promise<Paginated<CategoryWithBookCount>> {
  const { page, pageSize, searchTerm } = params;
  const adminClient = createAdminClient();

  const { safePage, safePageSize, from, to } = buildCategoryQueryOptions(page, pageSize);

  const query = applyCategorySearchFilter(
    adminClient
      .from("categoria")
      .select("*, libro(count)", { count: "exact" })
      .is("deleted_at", null)
      .is("libro.deleted_at", null)
      .range(from, to)
      .order("id", { ascending: false }),
    searchTerm
  );

  const { data, error, count } = await query;

  if (error) throw error;

  const normalized = (data ?? []).map((row: CategoryRow & Record<string, unknown>) =>
    normalizeCategoryWithBookCount(row)
  );

  return {
    data: normalized,
    total: count || 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count || 0) / safePageSize),
  };
}

/**
 * Actualiza una categoría activa por su ID.
 */
export async function updateCategoryById(
  categoryId: CategoryId,
  input: CategoryUpdateInput,
): Promise<void> {
  const adminClient = createAdminClient();

  const payload = buildCategoryUpdatePayload(input);

  const { data, error } = await adminClient
    .from("categoria")
    .update(payload)
    .eq("id", categoryId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("Error al actualizar categoría:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Categoría no encontrada.");
  }
}

/**
 * Realiza eliminación lógica de una categoría activa por su ID.
 */
export async function softDeleteCategoryById(
  categoryId: CategoryId,
): Promise<void> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("categoria")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", categoryId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("Error al eliminar lógicamente categoría:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Categoría no encontrada.");
  }
}

// ─── Helpers para validaciones en services/categoria ────────────────

/**
 * Obtiene una categoría activa por ID.
 * Helper para validar existencia antes de editar/eliminar.
 */
export async function getActiveCategoryById(
  categoryId: CategoryId,
): Promise<CategoryRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("categoria")
    .select("*")
    .eq("id", categoryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener categoría por ID:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene una categoría activa por nombre exacto (case-insensitive).
 * Helper para validar duplicados al crear.
 */
export async function getActiveCategoryByExactName(
  categoryName: CategoryName,
): Promise<CategoryRow | null> {
  const adminClient = createAdminClient();
  const exactNamePattern = escapeLikePattern(categoryName);

  const { data, error } = await adminClient
    .from("categoria")
    .select("*")
    .is("deleted_at", null)
    .ilike("nombre", exactNamePattern)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener categoría por nombre:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene una categoría activa por nombre exacto excluyendo un ID.
 * Helper para validar duplicados al editar. no detecta la categoria propia
 */
export async function getActiveCategoryByExactNameExcludingId(
  categoryName: CategoryName,
  excludedCategoryId: CategoryId,
): Promise<CategoryRow | null> {
  const adminClient = createAdminClient();
  const exactNamePattern = escapeLikePattern(categoryName);

  const { data, error } = await adminClient
    .from("categoria")
    .select("*")
    .is("deleted_at", null)
    .neq("id", excludedCategoryId)
    .ilike("nombre", exactNamePattern)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error al buscar duplicado de categoría:", error);
    throw error;
  }

  return data;
}

/**
 * Verifica si existe al menos un libro activo asociado a la categoría.
 * Helper para validar regla de eliminación lógica.
 */
export async function hasActiveBooksForCategory(
  categoryId: CategoryId,
): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .select("id")
    .eq("id_categoria", categoryId)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    console.error("Error al verificar libros asociados a la categoría:", error);
    throw error;
  }

  return hasActiveBooks(data);
}

/**
 * Verifica si existe una categoría activa por su ID.
 * Helper para validaciones en services/rules.
 */
export async function checkCategoryExistsById(id: number): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("categoria")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[categoryModel] Error al verificar existencia de categoría por ID:", error);
    throw error;
  }

  return !!data;
}
