"use server";

import { CredentialData, PersonalData, RegisterResponse, Rol } from "@/lib/types/auth";
import { register } from "@/services/auth/registrationService";
import { validatePasswordRule } from "@/lib/validations/auth";
import { signIn } from "@/models/authModel";

// ─── Validación de entrada ─────────────────────────────────────────

/**
 * Valida los datos personales y de credenciales antes del registro.
 */
function validateRegistrationData(
  credentialData: CredentialData,
  personalData: PersonalData
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Validar campos obligatorios de datos personales
  for (const [key, value] of Object.entries(personalData)) {
    if (
      key !== "direccion_detalle" &&
      key !== "direccion_place_id" &&
      (value === null || value === undefined || value.toString().trim() === "")
    ) {
      errors[key] = "Este campo es obligatorio.";
    }
  }

  // Validar campos obligatorios de credenciales
  for (const [key, value] of Object.entries(credentialData)) {
    if (value === null || value === undefined || value.toString().trim() === "") {
      errors[key] = "Este campo es obligatorio.";
    }
  }

  // Validaciones específicas
  if (!errors.dni && personalData.dni.length < 7) {
    errors.dni = "El DNI debe tener al menos 7 dígitos.";
  }

  if (!errors.fecha_nacimiento) {
    const fechaSeleccionada = new Date(personalData.fecha_nacimiento);
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

  if (!errors.contrasena) {
    const passwordError = validatePasswordRule(credentialData.contrasena);
    if (passwordError) {
      errors.contrasena = passwordError;
    }
  }

  if (
    !errors.confirmar_contrasena &&
    credentialData.contrasena !== credentialData.confirmar_contrasena
  ) {
    errors.confirmar_contrasena = "Las contraseñas no coinciden.";
  }

  if (!errors.direccion && !personalData.direccion_place_id) {
    errors.direccion =
      "Por favor selecciona una dirección válida de las sugerencias.";
  }

  return errors;
}

// ─── Server Action ─────────────────────────────────────────────────

export async function registerUser(
  credentialData: CredentialData,
  personalData: PersonalData
): Promise<RegisterResponse> {
  // 1. Validar los datos de entrada
  const validationErrors = validateRegistrationData(
    credentialData,
    personalData
  );

  if (Object.keys(validationErrors).length > 0) {
    return {
      success: false,
      errors: validationErrors,
    };
  }

  // 2. Delegar al servicio de registro
  try {
    const response = await register(credentialData, personalData, Rol.CLIENTE);

    if (response.success) {
      // Iniciar sesión automáticamente para establecer las cookies
      const sessionData = await signIn(credentialData.correo, credentialData.contrasena);
      if (!sessionData) {
        console.error("Auto-login falló después del registro de:", credentialData.correo);
      }
    }

    return response;
  } catch (error: unknown) {
    console.error("Error inesperado en registerUser:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Desconocido";
    return {
      success: false,
      errors: { form: `Error inesperado: ${errorMessage}` },
    };
  }
}
