"use server";

import { getCurrentUser } from "@/models/authModel";
import { Genero } from "@/lib/types/auth";
import type { ProfileUpdateResponse } from "@/lib/types/profile";
import { validateProfileFields } from "@/lib/validations/profile";
import { validatePasswordRule } from "@/lib/validations/auth";
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

  // 2. Extraer campos del formulario
  const dni = formData.get("dni") as string;
  const nombres = formData.get("nombres") as string;
  const apellidos = formData.get("apellidos") as string;
  const fecha_nacimiento = formData.get("fecha_nacimiento") as string;
  const lugar_nacimiento = formData.get("lugar_nacimiento") as string;
  const genero = formData.get("genero") as Genero;
  const usuario = formData.get("usuario") as string;
  const direccion_detalle = (formData.get("direccion_detalle") as string | null) || null;
  const nueva_contrasena = formData.get("nueva_contrasena") as string;
  const confirmar_contrasena = formData.get("confirmar_contrasena") as string;

  // 3. Validar campos de perfil
  const profileErrors = validateProfileFields(
    {
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      lugar_nacimiento,
      genero,
      usuario,
      direccion: formattedAddress,
      direccion_place_id: placeId,
      direccion_detalle,
    },
    { requireDni: true }
  );

  // 4. Validar contraseñas
  if (!nueva_contrasena) {
    profileErrors.nueva_contrasena = "La nueva contraseña es obligatoria.";
  } else {
    const pwdError = validatePasswordRule(nueva_contrasena);
    if (pwdError) {
      profileErrors.nueva_contrasena = pwdError;
    }
  }

  if (!confirmar_contrasena) {
    profileErrors.confirmar_contrasena = "Debes confirmar la contraseña.";
  } else if (nueva_contrasena !== confirmar_contrasena) {
    profileErrors.confirmar_contrasena = "Las contraseñas no coinciden.";
  }

  if (Object.keys(profileErrors).length > 0) {
    return { success: false, errors: profileErrors };
  }

  // 5. Delegar al servicio
  try {
    return await completeAdminProfile({
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      lugar_nacimiento,
      genero,
      usuario,
      direccion: formattedAddress,
      direccion_place_id: placeId,
      direccion_detalle,
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
