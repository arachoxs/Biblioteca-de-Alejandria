"use server";

import { CredentialData, PersonalData, RegisterResponse, Rol } from "@/lib/types/auth";
import { register } from "@/services/auth/registrationService";
import { validatePasswordRule } from "@/lib/validations/auth";
import { validateProfileFields } from "@/lib/validations/profile";

// ─── Validación de entrada ─────────────────────────────────────────

/**
 * Valida los datos personales y de credenciales antes del registro.
 */
function validateRegistrationData(
  credentialData: CredentialData,
  personalData: PersonalData
): Record<string, string> {
  const errors: Record<string, string> = validateProfileFields(personalData, { requireDni: true });

  // Validar campos obligatorios de credenciales
  for (const [key, value] of Object.entries(credentialData)) {
    if (value === null || value === undefined || value.toString().trim() === "") {
      errors[key] = "Este campo es obligatorio.";
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
    return await register(credentialData, personalData, Rol.CLIENTE);
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
