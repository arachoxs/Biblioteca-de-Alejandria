import { createAdminClient } from "@/lib/supabase/server";
import type {
  InsertAuthorPreferencePayload,
  AuthorPreferenceAuthorSummary,
  AuthorPreferenceRow,
  AuthorPreferenceWithDetails,
} from "@/lib/types/authorPreference";

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isAuthorPreferenceAuthorSummary(
  value: unknown
): value is AuthorPreferenceAuthorSummary {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.nombre === "string" &&
    isNullableString(candidate.nacionalidad) &&
    isNullableString(candidate.fecha_nacimiento)
  );
}

function normalizeAuthorPreferenceAuthor(
  value: unknown
): AuthorPreferenceAuthorSummary | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value[0];
    return isAuthorPreferenceAuthorSummary(first) ? first : null;
  }

  return isAuthorPreferenceAuthorSummary(value) ? value : null;
}

function normalizeAuthorPreferenceWithDetails(
  row: AuthorPreferenceRow & { autor?: unknown }
): AuthorPreferenceWithDetails {
  const { autor, ...preference } = row;
  return {
    ...preference,
    autor: normalizeAuthorPreferenceAuthor(autor),
  };
}

export async function insertAuthorPreference(
  data: InsertAuthorPreferencePayload
): Promise<number> {
  const adminClient = createAdminClient();

  const { data: resultData, error } = await adminClient
    .from("preferencia_autor")
    .insert({
      id_usuario: data.id_usuario,
      id_autor: data.id_autor,
    })
    .select("id")
    .single();

  if (error) {
    console.error(
      "[authorPreferenceModel] Error al insertar preferencia de autor:",
      error
    );

    if (error.code === "23505") {
      throw new Error("Este autor ya está en tus preferencias.");
    }

    throw error;
  }

  return resultData!.id;
}

export async function deleteAuthorPreference(
  id_usuario: string,
  id_autor: number
): Promise<void> {
  const adminClient = createAdminClient();

  const { data: existing, error: selectError } = await adminClient
    .from("preferencia_autor")
    .select("id")
    .eq("id_usuario", id_usuario)
    .eq("id_autor", id_autor)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error(
      "[authorPreferenceModel] Error al verificar preferencia:",
      selectError
    );
    throw selectError;
  }

  if (!existing) {
    throw new Error("La preferencia no existe o ya fue eliminada.");
  }

  const { data: updatedRows, error } = await adminClient
    .from("preferencia_autor")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_usuario", id_usuario)
    .eq("id_autor", id_autor)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error(
      "[authorPreferenceModel] Error al eliminar preferencia de autor:",
      error
    );
    throw error;
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error("La preferencia no existe o ya fue eliminada.");
  }
}

export async function getAuthorPreferencesByUser(
  id_usuario: string
): Promise<AuthorPreferenceWithDetails[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("preferencia_autor")
    .select("*, autor(id, nombre, nacionalidad, fecha_nacimiento)")
    .eq("id_usuario", id_usuario)
    .is("deleted_at", null)
    .order("id", { ascending: false });

  if (error) {
    console.error(
      "[authorPreferenceModel] Error al obtener preferencias de autor:",
      error
    );
    throw error;
  }

  return (data ?? []).map((row) =>
    normalizeAuthorPreferenceWithDetails(
      row as AuthorPreferenceRow & { autor?: unknown }
    )
  );
}

export async function checkAuthorPreferenceExists(
  id_usuario: string,
  id_autor: number
): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("preferencia_autor")
    .select("id")
    .eq("id_usuario", id_usuario)
    .eq("id_autor", id_autor)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "[authorPreferenceModel] Error al verificar preferencia de autor:",
      error
    );
    throw error;
  }

  return !!data;
}
