"use server";

import { getCurrentUser } from "@/models/authModel";
import type { Genero } from "@/lib/types/auth";
import type { ProfileUpdatePayload, ProfileUpdateResponse } from "@/lib/types/profile";
import { validateAndSanitizeProfile } from "@/lib/validations/profile";
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

  // 2. Validar y sanitizar
  const { errors, sanitized } = validateAndSanitizeProfile({
    nombres: formData.get("nombres") as string,
    apellidos: formData.get("apellidos") as string,
    fecha_nacimiento: formData.get("fecha_nacimiento") as string,
    lugar_nacimiento: formData.get("lugar_nacimiento") as string,
    genero: formData.get("genero") as Genero,
    usuario: formData.get("usuario") as string,
    direccion: formattedAddress,
    direccion_place_id: placeId,
    direccion_detalle: (formData.get("direccion_detalle") as string | null) || null,
  });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // 3. Construir payload con datos sanitizados
  const payload: ProfileUpdatePayload = {
    nombres: sanitized.nombres,
    apellidos: sanitized.apellidos,
    fecha_nacimiento: sanitized.fecha_nacimiento,
    lugar_nacimiento: sanitized.lugar_nacimiento,
    genero: sanitized.genero as Genero,
    usuario: sanitized.usuario,
    direccion: sanitized.direccion,
    direccion_place_id: sanitized.direccion_place_id!,
    direccion_detalle: sanitized.direccion_detalle ?? null,
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
