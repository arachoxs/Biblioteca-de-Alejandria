"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/services/errors";
import { getCurrentUser } from "@/models/authModel";

import { addAuthorPreference, removeAuthorPreference, getMyAuthorPreferences } from "@/services/preferencias/preferenciasService";
import { addCategoryPreference, removeCategoryPreference, getMyCategoryPreferences } from "@/services/preferencias/preferenciasService";
import type { AuthorPreferenceActionResponse } from "@/lib/types/authorPreference";
import type { CategoryPreferenceActionResponse } from "@/lib/types/categoryPreference";
import type { Genero } from "@/lib/types/auth";
import type { ProfileUpdatePayload, ProfileUpdateResponse, EditPerfilFormValues } from "@/lib/types/profile";
import { validateProfileUpdate } from "@/lib/validations/profile";
import { updateProfile } from "@/services/profile/profileService";
import { revalidatePath } from "next/cache";

interface PreferenceItem {
  id: number;
  nombre: string;
}

interface PreferenceDataResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  authors: PreferenceItem[];
  categories: PreferenceItem[];
  selectedAuthorIds: number[];
  selectedCategoryIds: number[];
}

async function getAllAuthors(): Promise<PreferenceItem[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("autor")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, nombre: row.nombre }));
}

async function getAllCategories(): Promise<PreferenceItem[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("categoria")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(row => ({ id: row.id, nombre: row.nombre }));
}

export async function getPreferenceDataAction(): Promise<PreferenceDataResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "No hay sesión activa." },
      authors: [],
      categories: [],
      selectedAuthorIds: [],
      selectedCategoryIds: [],
    };
  }

  try {
    const [authorPrefsResult, categoryPrefsResult, authorsData, categoriesData] = await Promise.all([
      getMyAuthorPreferences(),
      getMyCategoryPreferences(),
      getAllAuthors(),
      getAllCategories(),
    ]);

    const selectedAuthorIds = authorPrefsResult.success && authorPrefsResult.data
      ? authorPrefsResult.data.map(p => p.id_autor)
      : [];

    const selectedCategoryIds = categoryPrefsResult.success && categoryPrefsResult.data
      ? categoryPrefsResult.data.map(p => p.id_categoria)
      : [];

    return {
      success: true,
      authors: authorsData,
      categories: categoriesData,
      selectedAuthorIds,
      selectedCategoryIds,
    };
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      authors: [],
      categories: [],
      selectedAuthorIds: [],
      selectedCategoryIds: [],
    };
  }
}

export async function updateAuthorPreferencesAction(
  authorIds: number[]
): Promise<AuthorPreferenceActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." }, message: "No hay sesión activa." };
  }

  try {
    const currentResult = await getMyAuthorPreferences();
    if (!currentResult.success || !currentResult.data) {
      return { success: false, errors: { form: currentResult.message ?? "Error al obtener preferencias." }, message: currentResult.message };
    }

    const currentIds = currentResult.data.map(p => p.id_autor);
    const toAdd = authorIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !authorIds.includes(id));

    const removeResults = await Promise.all(
      toRemove.map(id_autor => removeAuthorPreference(id_autor))
    );
    const removeFailed = removeResults.find(r => !r.success);
    if (removeFailed) {
      return { success: false, errors: removeFailed.errors ?? { form: removeFailed.message ?? "Error" }, message: removeFailed.message };
    }

    const addResults = await Promise.all(
      toAdd.map(id_autor => addAuthorPreference({ id_autor }))
    );
    const addFailed = addResults.find(r => !r.success);
    if (addFailed) {
      return { success: false, errors: addFailed.errors ?? { form: addFailed.message ?? "Error" }, message: addFailed.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }
}

export async function updateCategoryPreferencesAction(
  categoryIds: number[]
): Promise<CategoryPreferenceActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, errors: { form: "No hay sesión activa." }, message: "No hay sesión activa." };
  }

  try {
    const currentResult = await getMyCategoryPreferences();
    if (!currentResult.success || !currentResult.data) {
      return { success: false, errors: { form: currentResult.message ?? "Error al obtener preferencias." }, message: currentResult.message };
    }

    const currentIds = currentResult.data.map(p => p.id_categoria);
    const toAdd = categoryIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !categoryIds.includes(id));

    const removeResults = await Promise.all(
      toRemove.map(id_categoria => removeCategoryPreference(id_categoria))
    );
    const removeFailed = removeResults.find(r => !r.success);
    if (removeFailed) {
      return { success: false, errors: removeFailed.errors ?? { form: removeFailed.message ?? "Error" }, message: removeFailed.message };
    }

    const addResults = await Promise.all(
      toAdd.map(id_categoria => addCategoryPreference({ id_categoria }))
    );
    const addFailed = addResults.find(r => !r.success);
    if (addFailed) {
      return { success: false, errors: addFailed.errors ?? { form: addFailed.message ?? "Error" }, message: addFailed.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, errors: { form: getErrorMessage(error) }, message: getErrorMessage(error) };
  }
}

export async function updateProfileAction(
  formData: EditPerfilFormValues,
  formattedAddress: string,
  placeId: string
): Promise<ProfileUpdateResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "No hay sesión activa. Inicia sesión para continuar." },
    };
  }

  const { errors, sanitized } = validateProfileUpdate({
    nombres: formData.nombres,
    apellidos: formData.apellidos,
    genero: formData.genero as Genero,
    usuario: formData.usuario,
    direccion: formattedAddress,
    direccion_place_id: placeId,
    direccion_detalle: formData.direccion_detalle,
  });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const payload: ProfileUpdatePayload = {
    ...sanitized,
    genero: sanitized.genero as Genero,
  };

  try {
    const result = await updateProfile(payload);

    if (result.success) {
      revalidatePath("/perfil");
    }

    return result;
  } catch (error: unknown) {
    console.error("Error inesperado en updateProfileAction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}