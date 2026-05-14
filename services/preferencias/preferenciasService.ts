import { requireClientRole } from "@/lib/validations/server-auth";
import { getCurrentUser } from "@/models/authModel";
import { getErrorMessage } from "@/lib/services/errors";
import {
  insertAuthorPreference,
  deleteAuthorPreference,
  getAuthorPreferencesByUser,
} from "@/models/authorPreferenceModel";
import {
  checkAuthorPreferenceNotDuplicate,
  checkPreferenceAuthorExists,
} from "@/services/rules/preferenciasRules";
import type {
  AddAuthorPreferenceInput,
  AuthorPreferenceActionResponse,
  AuthorPreferenceDataResponse,
  AuthorPreferenceWithDetails,
} from "@/lib/types/authorPreference";

export async function addAuthorPreference(
  data: AddAuthorPreferenceInput
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

  let insertedId: number;
  try {
    insertedId = await insertAuthorPreference({ id_usuario: user.id, id_autor: data.id_autor });
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, id: insertedId };
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

  try {
    await deleteAuthorPreference(user.id, id_autor);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
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

  let preferences: AuthorPreferenceWithDetails[];
  try {
    preferences = await getAuthorPreferencesByUser(user.id);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, data: preferences };
}