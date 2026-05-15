import { checkAuthorPreferenceExists } from "@/models/authorPreferenceModel";
import { checkAuthorExistsById } from "@/models/authorModel";
import { getErrorMessage } from "@/lib/services/errors";
import type { AuthorPreferenceActionResponse } from "@/lib/types/authorPreference";
import { checkCategoryPreferenceExists } from "@/models/categoryPreferenceModel";
import { checkCategoryExistsById } from "@/models/categoryModel";
import type { CategoryPreferenceActionResponse } from "@/lib/types/categoryPreference";

export async function checkAuthorPreferenceNotDuplicate(
  id_usuario: string,
  id_autor: number
): Promise<AuthorPreferenceActionResponse | null> {
  let exists: boolean;
  try {
    exists = await checkAuthorPreferenceExists(id_usuario, id_autor);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: getErrorMessage(error),
    };
  }
  if (exists) {
    return {
      success: false,
      errors: { form: "Ya tienes este autor en tus preferencias." },
      message: "Ya tienes este autor en tus preferencias.",
    };
  }
  return null;
}

export async function checkCategoryPreferenceNotDuplicate(
  id_usuario: string,
  id_categoria: number
): Promise<CategoryPreferenceActionResponse | null> {
  let exists: boolean;
  try {
    exists = await checkCategoryPreferenceExists(id_usuario, id_categoria);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: getErrorMessage(error),
    };
  }
  if (exists) {
    return {
      success: false,
      errors: { form: "Ya tienes esta categoría en tus preferencias." },
      message: "Ya tienes esta categoría en tus preferencias.",
    };
  }
  return null;
}

export async function checkPreferenceCategoryExists(
  id_categoria: number
): Promise<CategoryPreferenceActionResponse | null> {
  let exists: boolean;
  try {
    exists = await checkCategoryExistsById(id_categoria);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: getErrorMessage(error),
    };
  }
  if (!exists) {
    return {
      success: false,
      errors: { form: "La categoría seleccionada no existe." },
      message: "La categoría seleccionada no existe.",
    };
  }
  return null;
}

export async function checkPreferenceAuthorExists(
  id_autor: number
): Promise<AuthorPreferenceActionResponse | null> {
  let exists: boolean;
  try {
    exists = await checkAuthorExistsById(id_autor);
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: getErrorMessage(error),
    };
  }
  if (!exists) {
    return {
      success: false,
      errors: { form: "El autor seleccionado no existe." },
      message: "El autor seleccionado no existe.",
    };
  }
  return null;
}