import { getAuthenticatedUser } from "@/lib/preferencias/preferenciaServiceUtils";
import { getErrorMessage } from "@/lib/services/errors";
import {
  insertOrRestoreAuthorPreference,
  deleteAuthorPreference,
  getAuthorPreferencesByUser,
} from "@/models/authorPreferenceModel";
import {
  insertOrRestoreCategoryPreference,
  deleteCategoryPreference,
  getCategoryPreferencesByUser,
} from "@/models/categoryPreferenceModel";
import {
  checkAuthorPreferenceNotDuplicate,
  checkPreferenceAuthorExists,
  checkCategoryPreferenceNotDuplicate,
  checkPreferenceCategoryExists,
} from "@/services/rules/preferenciasRules";
import type {
  AddAuthorPreferenceInput,
  AuthorPreferenceActionResponse,
  AuthorPreferenceDataResponse,
  AuthorPreferenceWithDetails,
} from "@/lib/types/authorPreference";
import type {
  AddCategoryPreferenceInput,
  CategoryPreferenceActionResponse,
  CategoryPreferenceDataResponse,
  CategoryPreferenceWithDetails,
} from "@/lib/types/categoryPreference";
import type { User } from "@supabase/supabase-js";

export async function addAuthorPreference(
  data: AddAuthorPreferenceInput
): Promise<AuthorPreferenceActionResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return auth;

  const user = (auth as { success: true; user: User }).user;

  const precheckDuplicate = await checkAuthorPreferenceNotDuplicate(user.id, data.id_autor);
  if (precheckDuplicate) return precheckDuplicate;

  const precheckAuthor = await checkPreferenceAuthorExists(data.id_autor);
  if (precheckAuthor) return precheckAuthor;

  let insertedId: number;
  try {
    insertedId = await insertOrRestoreAuthorPreference({ id_usuario: user.id, id_autor: data.id_autor });
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, id: insertedId };
}

export async function addCategoryPreference(
  data: AddCategoryPreferenceInput
): Promise<CategoryPreferenceActionResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return auth;

  const user = (auth as { success: true; user: User }).user;

  const precheckDuplicate = await checkCategoryPreferenceNotDuplicate(user.id, data.id_categoria);
  if (precheckDuplicate) return precheckDuplicate;

  const precheckCategory = await checkPreferenceCategoryExists(data.id_categoria);
  if (precheckCategory) return precheckCategory;

  let insertedId: number;
  try {
    insertedId = await insertOrRestoreCategoryPreference({ id_usuario: user.id, id_categoria: data.id_categoria });
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, id: insertedId };
}

export async function removeAuthorPreference(
  id_autor: number
): Promise<AuthorPreferenceActionResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return auth;

  const user = (auth as { success: true; user: User }).user;

  try {
    await deleteAuthorPreference(user.id, id_autor);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true };
}

export async function removeCategoryPreference(
  id_categoria: number
): Promise<CategoryPreferenceActionResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return auth;

  const user = (auth as { success: true; user: User }).user;

  try {
    await deleteCategoryPreference(user.id, id_categoria);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true };
}

export async function getMyAuthorPreferences(): Promise<AuthorPreferenceDataResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return { success: false, errors: { form: auth.message ?? "No tienes permisos." }, message: auth.message };

  const user = (auth as { success: true; user: User }).user;

  let preferences: AuthorPreferenceWithDetails[];
  try {
    preferences = await getAuthorPreferencesByUser(user.id);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, data: preferences };
}

export async function getMyCategoryPreferences(): Promise<CategoryPreferenceDataResponse> {
  const auth = await getAuthenticatedUser();
  if (!auth.success) return { success: false, errors: { form: auth.message ?? "No tienes permisos." }, message: auth.message };

  const user = (auth as { success: true; user: User }).user;

  let preferences: CategoryPreferenceWithDetails[];
  try {
    preferences = await getCategoryPreferencesByUser(user.id);
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }

  return { success: true, data: preferences };
}