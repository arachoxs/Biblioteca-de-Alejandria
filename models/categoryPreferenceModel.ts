import { createAdminClient } from "@/lib/supabase/server";
import { findPreferenceId } from "@/lib/preferencias/preferenceQueryBuilder";
import type {
  InsertCategoryPreferencePayload,
  CategoryPreferenceCategorySummary,
  CategoryPreferenceRow,
  CategoryPreferenceWithDetails,
} from "@/lib/types/categoryPreference";

function isCategoryPreferenceCategorySummary(
  value: unknown
): value is CategoryPreferenceCategorySummary {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return typeof candidate.id === "number" && typeof candidate.nombre === "string";
}

function normalizeCategoryPreferenceCategory(
  value: unknown
): CategoryPreferenceCategorySummary | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value[0];
    return isCategoryPreferenceCategorySummary(first) ? first : null;
  }

  return isCategoryPreferenceCategorySummary(value) ? value : null;
}

function normalizeCategoryPreferenceWithDetails(
  row: CategoryPreferenceRow & { categoria?: unknown }
): CategoryPreferenceWithDetails {
  const { categoria, ...preference } = row;
  return {
    ...preference,
    categoria: normalizeCategoryPreferenceCategory(categoria),
  };
}

async function findCategoryPreferenceId(
  id_usuario: string,
  id_categoria: number
): Promise<number | null> {
  return findPreferenceId("categoria", id_usuario, id_categoria, "active");
}

async function findCategoryPreferenceIdIncludingDeleted(
  id_usuario: string,
  id_categoria: number
): Promise<number | null> {
  return findPreferenceId("categoria", id_usuario, id_categoria, "all");
}

async function restoreCategoryPreference(existingId: number): Promise<number> {
  const adminClient = createAdminClient();
  const { data: updatedRows, error } = await adminClient
    .from("preferencia_categoria")
    .update({ deleted_at: null })
    .eq("id", existingId)
    .select("id");

  if (error) {
    console.error(
      "[categoryPreferenceModel] Error al restaurar preferencia de categoría:",
      error
    );
    throw error;
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("La preferencia no existe o ya fue eliminada.");
  }

  return existingId;
}

async function insertCategoryPreference(
  id_usuario: string,
  id_categoria: number
): Promise<number> {
  const adminClient = createAdminClient();
  const { data: insertData, error } = await adminClient
    .from("preferencia_categoria")
    .insert({ id_usuario, id_categoria })
    .select("id")
    .single();

  if (error) {
    console.error(
      "[categoryPreferenceModel] Error al insertar preferencia de categoría:",
      error
    );
    if (error.code === "23505") {
      throw new Error("Esta categoría ya está en tus preferencias.");
    }
    throw error;
  }

  return insertData!.id;
}

export async function insertOrRestoreCategoryPreference(
  data: InsertCategoryPreferencePayload
): Promise<number> {
  const existingId = await findCategoryPreferenceIdIncludingDeleted(
    data.id_usuario,
    data.id_categoria
  );

  if (existingId !== null) {
    return restoreCategoryPreference(existingId);
  }

  return insertCategoryPreference(data.id_usuario, data.id_categoria);
}

async function ensureCategoryPreferenceExists(
  id_usuario: string,
  id_categoria: number
): Promise<number> {
  const id = await findCategoryPreferenceId(id_usuario, id_categoria);

  if (id === null) {
    throw new Error("La preferencia no existe o ya fue eliminada.");
  }

  return id;
}

export async function deleteCategoryPreference(
  id_usuario: string,
  id_categoria: number
): Promise<void> {
  const adminClient = createAdminClient();

  const existingId = await ensureCategoryPreferenceExists(id_usuario, id_categoria);

  const { data: updatedRows, error } = await adminClient
    .from("preferencia_categoria")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", existingId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error(
      "[categoryPreferenceModel] Error al eliminar preferencia de categoría:",
      error
    );
    throw error;
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("La preferencia no existe o ya fue eliminada.");
  }
}

export async function getCategoryPreferencesByUser(
  id_usuario: string
): Promise<CategoryPreferenceWithDetails[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("preferencia_categoria")
    .select("*, categoria(id, nombre)")
    .eq("id_usuario", id_usuario)
    .is("deleted_at", null)
    .order("id", { ascending: false });

  if (error) {
    console.error(
      "[categoryPreferenceModel] Error al obtener preferencias de categoría:",
      error
    );
    throw error;
  }

  return (data ?? []).map((row) =>
    normalizeCategoryPreferenceWithDetails(
      row as CategoryPreferenceRow & { categoria?: unknown }
    )
  );
}

export async function checkCategoryPreferenceExists(
  id_usuario: string,
  id_categoria: number
): Promise<boolean> {
  const id = await findCategoryPreferenceId(id_usuario, id_categoria);
  return id !== null;
}