import { checkAuthorPreferenceExists } from "@/models/authorPreferenceModel";
import { checkAuthorExistsById } from "@/models/authorModel";
import type { AuthorPreferenceActionResponse } from "@/lib/types/authorPreference";

export async function checkAuthorPreferenceNotDuplicate(
  id_usuario: string,
  id_autor: number
): Promise<AuthorPreferenceActionResponse | null> {
  const exists = await checkAuthorPreferenceExists(id_usuario, id_autor);
  if (exists) {
    return {
      success: false,
      errors: { form: "Ya tienes este autor en tus preferencias." },
      message: "Ya tienes este autor en tus preferencias.",
    };
  }
  return null;
}

export async function checkPreferenceAuthorExists(
  id_autor: number
): Promise<AuthorPreferenceActionResponse | null> {
  const exists = await checkAuthorExistsById(id_autor);
  if (!exists) {
    return {
      success: false,
      errors: { form: "El autor seleccionado no existe." },
      message: "El autor seleccionado no existe.",
    };
  }
  return null;
}