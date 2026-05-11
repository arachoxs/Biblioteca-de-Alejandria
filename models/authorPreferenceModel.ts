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
    return { success: false, error: error.message };
  }

  return { success: true, id: resultData?.id };
}

export async function deleteAuthorPreference(
  id_usuario: string,
  id_autor: number
): Promise<ModelResult> {
  const adminClient = createAdminClient();

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

  return (data || []) as AuthorPreferenceWithDetails[];
}