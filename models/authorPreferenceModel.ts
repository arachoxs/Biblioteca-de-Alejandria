import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult } from "@/lib/types/common";
import type {
  InsertAuthorPreferencePayload,
  AuthorPreferenceWithDetails,
} from "@/lib/types/authorPreference";

export async function insertAuthorPreference(
  data: InsertAuthorPreferencePayload
): Promise<ModelResult & { id?: number }> {
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

    // Handle unique constraint violation (race condition fallback)
    if (error.code === "23505") {
      return { success: false, error: "Este autor ya está en tus preferencias." };
    }

    return { success: false, error: error.message };
  }

  return { success: true, id: resultData?.id };
}

export async function deleteAuthorPreference(
  id_usuario: string,
  id_autor: number
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  // First verify the row exists and belongs to the user
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
    return { success: false, error: selectError.message };
  }

  if (!existing) {
    return { success: false, error: "La preferencia no existe o ya fue eliminada." };
  }

  // Perform soft delete
  const { error } = await adminClient
    .from("preferencia_autor")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_usuario", id_usuario)
    .eq("id_autor", id_autor)
    .is("deleted_at", null);

  if (error) {
    console.error(
      "[authorPreferenceModel] Error al eliminar preferencia de autor:",
      error
    );
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getAuthorPreferencesByUser(
  id_usuario: string
): Promise<AuthorPreferenceWithDetails[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("preferencia_autor")
    .select("*, autor(*)")
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

  return (data || []) as AuthorPreferenceWithDetails[];
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