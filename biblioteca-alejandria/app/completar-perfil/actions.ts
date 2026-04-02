"use server";

import { getCurrentUser } from "@/models/authModel";
import type { Genero } from "@/lib/types/auth";
import type { ProfileUpdateResponse } from "@/lib/types/profile";
import { validateAndSanitizeProfile } from "@/lib/validations/profile";
import { validatePasswordRule } from "@/lib/validations/rules";
import { completeAdminProfile } from "@/services/profile/completeProfileService";

// ─── Server Action ─────────────────────────────────────────────────

export async function completarPerfilAction(
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

  // 2. Extraer y validar campos
  const nueva_contrasena = formData.get("nueva_contrasena") as string;
  const confirmar_contrasena = formData.get("confirmar_contrasena") as string;

  const { errors: profileErrors, sanitized } = validateAndSanitizeProfile(
    {
      dni: formData.get("dni") as string,
      nombres: formData.get("nombres") as string,
      apellidos: formData.get("apellidos") as string,
      fecha_nacimiento: formData.get("fecha_nacimiento") as string,
      lugar_nacimiento: formData.get("lugar_nacimiento") as string,
      genero: formData.get("genero") as Genero,
      usuario: formData.get("usuario") as string,
      direccion: formattedAddress,
      direccion_place_id: placeId,
      direccion_detalle: (formData.get("direccion_detalle") as string | null) || null,
    },
    { requireDni: true }
  );

  // 3. Validar contraseñas
  if (!nueva_contrasena) {
    profileErrors.nueva_contrasena = "La nueva contraseña es obligatoria.";
  } else {
    const pwdError = validatePasswordRule(nueva_contrasena);
    if (pwdError) profileErrors.nueva_contrasena = pwdError;
  }

  if (!confirmar_contrasena) {
    profileErrors.confirmar_contrasena = "Debes confirmar la contraseña.";
  } else if (nueva_contrasena !== confirmar_contrasena) {
    profileErrors.confirmar_contrasena = "Las contraseñas no coinciden.";
  }

  if (Object.keys(profileErrors).length > 0) {
    return { success: false, errors: profileErrors };
  }

  // 4. Delegar al servicio con datos sanitizados
  try {
    return await completeAdminProfile({
      dni: sanitized.dni!,
      nombres: sanitized.nombres,
      apellidos: sanitized.apellidos,
      fecha_nacimiento: sanitized.fecha_nacimiento,
      lugar_nacimiento: sanitized.lugar_nacimiento,
      genero: sanitized.genero as Genero,
      usuario: sanitized.usuario,
      direccion: sanitized.direccion,
      direccion_place_id: sanitized.direccion_place_id!,
      direccion_detalle: sanitized.direccion_detalle,
      nueva_contrasena,
    });
  } catch (error: unknown) {
    console.error("Error inesperado en completarPerfilAction:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
