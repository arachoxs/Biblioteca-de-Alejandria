"use server";

import { getCurrentUser } from "@/models/authModel";
import type { Genero } from "@/lib/types/auth";
import type { ProfileUpdatePayload, ProfileUpdateResponse } from "@/lib/types/profile";
import { validateProfileFields } from "@/lib/validations/profile";
import { updateProfile } from "@/services/profile/profileService";
import { revalidatePath } from "next/cache";

// ─── Server Action ─────────────────────────────────────────────────

export async function updateProfileAction(
  formData: FormData,
  formattedAddress: string,
  placeId: string
): Promise<ProfileUpdateResponse> {
  // 1. Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "No hay sesión activa. Inicia sesión para continuar." },
    };
  }

  // 2. Construir payload
  const payload: ProfileUpdatePayload = {
    nombres: formData.get("nombres") as string,
    apellidos: formData.get("apellidos") as string,
    fecha_nacimiento: formData.get("fecha_nacimiento") as string,
    lugar_nacimiento: formData.get("lugar_nacimiento") as string,
    genero: formData.get("genero") as Genero,
    usuario: formData.get("usuario") as string,
    direccion: formattedAddress,
    direccion_place_id: placeId,
    direccion_detalle: (formData.get("direccion_detalle") as string | null) || null,
  };

  // 3. Validar datos
  const validationErrors = validateProfileFields(payload);
  if (Object.keys(validationErrors).length > 0) {
    return { success: false, errors: validationErrors };
  }

  // 4. Delegar al servicio
  try {
    const result = await updateProfile(
      payload
    );

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
