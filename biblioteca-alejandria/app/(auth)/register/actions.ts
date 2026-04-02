"use server";

import { CredentialData, PersonalData, RegisterResponse, Rol } from "@/lib/types/auth";
import { register } from "@/services/auth/registrationService";
import { validatePasswordRule, validateEmail, sanitizeText } from "@/lib/validations/rules";
import { signIn } from "@/models/authModel";
import { validateAndSanitizeProfile } from "@/lib/validations/profile";
import { validatePasswords } from "@/lib/validations/auth";

// ─── Validación de entrada ─────────────────────────────────────────

function validateRegistrationData(
  credentialData: CredentialData,
  personalData: PersonalData
): { errors: Record<string, string>; sanitizedPersonal: PersonalData } {
  const profileResult = validateAndSanitizeProfile(personalData, { requireDni: true }); //validacion datos eprsonales correcto
  let errors = { ...profileResult.errors };

  // Sanitizar y validar email
  const cleanEmail = sanitizeText(credentialData.correo);
  if (!cleanEmail) {
    errors.correo = "El correo electrónico es obligatorio.";
  } else {
    const emailError = validateEmail(cleanEmail);
    if (emailError) errors.correo = emailError;
  }

  // Validar contraseña
  const passwordErrors = validatePasswords(credentialData.contrasena, credentialData.confirmar_contrasena);
  if (passwordErrors) {
    errors = { ...errors, ...passwordErrors };
  }

  // Construir datos personales sanitizados
  const sanitizedPersonal: PersonalData = {
    ...personalData,
    dni: profileResult.sanitized.dni ?? personalData.dni,
    nombres: profileResult.sanitized.nombres,
    apellidos: profileResult.sanitized.apellidos,
    fecha_nacimiento: profileResult.sanitized.fecha_nacimiento,
    lugar_nacimiento: profileResult.sanitized.lugar_nacimiento,
    usuario: profileResult.sanitized.usuario,
    direccion: profileResult.sanitized.direccion,
    direccion_place_id: profileResult.sanitized.direccion_place_id ?? personalData.direccion_place_id,
    direccion_detalle: profileResult.sanitized.direccion_detalle ?? undefined,
  };

  return { errors, sanitizedPersonal };
}

// ─── Server Action ─────────────────────────────────────────────────

export async function registerUser(
  credentialData: CredentialData,
  personalData: PersonalData
): Promise<RegisterResponse> {
  const { errors, sanitizedPersonal } = validateRegistrationData(
    credentialData,
    personalData
  );

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Sanitizar email de credenciales
  const sanitizedCredentials: CredentialData = {
    ...credentialData,
    correo: sanitizeText(credentialData.correo),
  };

  try {
    const response = await register(sanitizedCredentials, sanitizedPersonal, Rol.CLIENTE);

    if (response.success) {
      const sessionData = await signIn(sanitizedCredentials.correo, sanitizedCredentials.contrasena);
      if (!sessionData) {
        console.error("Auto-login falló después del registro de:", sanitizedCredentials.correo);
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
