"use server";

import { getCurrentUser } from "@/models/authModel";
import { Genero } from "@/lib/types/auth";
import type { ProfileUpdatePayload, ProfileUpdateResponse } from "@/lib/types/profile";
import { updateProfile } from "@/services/profile/profileService";
import { revalidatePath } from "next/cache";

// ─── Validación de entrada ─────────────────────────────────────────

function validateProfileData(
  payload: ProfileUpdatePayload
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Campos obligatorios
  const required: { key: keyof ProfileUpdatePayload; label: string }[] = [
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
    { key: "lugar_nacimiento", label: "Lugar de nacimiento" },
    { key: "genero", label: "Género" },
    { key: "usuario", label: "Nombre de usuario" },
    { key: "direccion", label: "Dirección" },
  ];

  for (const { key, label } of required) {
    const value = payload[key];
    if (!value || value.toString().trim() === "") {
      errors[key === "direccion" ? "direccion" : key] =
        `${label} es obligatorio.`;
    }
  }

  // Validar fecha de nacimiento
  if (!errors.fecha_nacimiento) {
    const fechaSeleccionada = new Date(payload.fecha_nacimiento);
    const hoy = new Date();

    if (Number.isNaN(fechaSeleccionada.getTime())) {
      errors.fecha_nacimiento = "La fecha de nacimiento no es válida.";
    } else {
      let edad = hoy.getFullYear() - fechaSeleccionada.getFullYear();
      const diferenciaMeses = hoy.getMonth() - fechaSeleccionada.getMonth();

      if (
        diferenciaMeses < 0 ||
        (diferenciaMeses === 0 && hoy.getDate() < fechaSeleccionada.getDate())
      ) {
        edad--;
      }

      if (fechaSeleccionada > hoy) {
        errors.fecha_nacimiento = "No puedes haber nacido en el futuro.";
      } else if (edad < 18) {
        errors.fecha_nacimiento = "Debes tener al menos 18 años.";
      } else if (edad > 80) {
        errors.fecha_nacimiento = "La edad máxima permitida es 80 años.";
      }
    }
  }

  // Validar dirección seleccionada con Google Places
  if (!errors.direccion && !payload.direccion_place_id) {
    errors.direccion =
      "Por favor selecciona una dirección válida de las sugerencias.";
  }

  return errors;
}

// ─── Server Action ─────────────────────────────────────────────────

export async function updateProfileAction(
  currentUsername: string,
  addressId: number,
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
    direccion_detalle: formData.get("direccion_detalle") as string,
  };

  // 3. Validar datos
  const validationErrors = validateProfileData(payload);
  if (Object.keys(validationErrors).length > 0) {
    return { success: false, errors: validationErrors };
  }

  // 4. Delegar al servicio
  try {
    const result = await updateProfile(
      user.id,
      currentUsername,
      addressId,
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
