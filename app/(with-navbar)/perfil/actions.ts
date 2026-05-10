"use server";

import { getCurrentUser } from "@/models/authModel";
import type { Genero } from "@/lib/types/auth";
import type { ProfileUpdatePayload, ProfileUpdateResponse, EditPerfilFormValues } from "@/lib/types/profile";
import { validateProfileUpdate } from "@/lib/validations/profile";
import { updateProfile } from "@/services/profile/profileService";
import { revalidatePath } from "next/cache";
// ─── Server Action ─────────────────────────────────────────────────

export async function updateProfileAction(
  formData: EditPerfilFormValues,
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

  // 2. Validar y sanitizar solo campos editables
  const { errors, sanitized } = validateProfileUpdate({ //se manda a verificar solo los campos editables, el payload se construye en la acción a partir de esos valores y de los otros datos como la dirección
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

  // 3. Construir payload con datos sanitizados
  const payload: ProfileUpdatePayload = {
    ...sanitized,
    genero: sanitized.genero as Genero, // Type assertion: la validación garantiza que no es ""
  }; 

  // 4. Delegar al servicio
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
