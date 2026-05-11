import { requireClientRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import {
  insertAuthorPreference,
  deleteAuthorPreference,
  getAuthorPreferencesByUser,
} from "@/models/authorPreferenceModel";
import {
  checkAuthorPreferenceNotDuplicate,
  checkPreferenceAuthorExists,
} from "@/lib/validations/preferencias/businessRules";
import type {
  InsertAuthorPreferencePayload,
  AuthorPreferenceActionResponse,
  AuthorPreferenceDataResponse,
} from "@/lib/types/authorPreference";

export async function addAuthorPreference(
  data: InsertAuthorPreferencePayload
): Promise<AuthorPreferenceActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." }, message: "No hay sesión activa." };
  }

  const precheckDuplicate = await checkAuthorPreferenceNotDuplicate(user.id, data.id_autor);
  if (precheckDuplicate) return precheckDuplicate;

  const precheckAuthor = await checkPreferenceAuthorExists(data.id_autor);
  if (precheckAuthor) return precheckAuthor;

  const result = await insertAuthorPreference({ id_usuario: user.id, id_autor: data.id_autor });

  if (!result.success) {
    return { success: false, errors: { form: result.error ?? "Error de base de datos." }, message: result.error };
  }

  return { success: true, id: result.id };
}

export async function removeAuthorPreference(
  id_autor: number
): Promise<AuthorPreferenceActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." }, message: "No hay sesión activa." };
  }

  const result = await deleteAuthorPreference(user.id, id_autor);

  if (!result.success) {
    return { success: false, errors: { form: result.error ?? "Error de base de datos." }, message: result.error };
  }

  return { success: true };
}

export async function getMyAuthorPreferences(): Promise<AuthorPreferenceDataResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return { success: false, errors: { form: roleCheck.message ?? "No tienes permisos." }, message: roleCheck.message };

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." } };
  }

  const preferences = await getAuthorPreferencesByUser(user.id);

  return { success: true, data: preferences };
}