"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Tipos de respuesta ────────────────────────────────────────────

export interface RecoveryState {
  error?: string;
  success?: boolean;
  message?: string;
}

// ─── Constantes de validación ──────────────────────────────────────

const PASSWORD_MIN_LENGTH = 8;
const OTP_LENGTH = 8;

const PASSWORD_RULES = [
  {
    test: (p: string) => p.length >= PASSWORD_MIN_LENGTH,
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  },
  {
    test: (p: string) => /[A-Z]/.test(p),
    message: "La contraseña debe incluir al menos una letra mayúscula.",
  },
  {
    test: (p: string) => /[0-9]/.test(p),
    message: "La contraseña debe incluir al menos un número.",
  },
] as const;

// ─── Paso 1: Enviar código de recuperación ─────────────────────────

export async function sendRecoveryCode(email: string): Promise<RecoveryState> {
  const trimmedEmail = email?.trim();

  if (!trimmedEmail) {
    return { error: "El correo electrónico es obligatorio." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

  if (error) {
    console.error("Error en resetPasswordForEmail:", error.message);
  }

  // Seguridad (CU-04, flujo alternativo 4a): siempre responder igual
  // para no revelar si el correo existe o no en la base de datos.
  return {
    success: true,
    message: "Si el correo está registrado, recibirás un código de recuperación.",
  };
}

// ─── Paso 2: Verificar código OTP ──────────────────────────────────

export async function verifyRecoveryCode(
  email: string,
  code: string
): Promise<RecoveryState> {
  const trimmedEmail = email?.trim();
  const trimmedCode = code?.trim();

  if (!trimmedEmail || !trimmedCode) {
    return { error: "El correo y el código son obligatorios." };
  }

  if (trimmedCode.length !== OTP_LENGTH || !/^\d+$/.test(trimmedCode)) {
    return { error: "El código debe ser de 8 dígitos numéricos." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email: trimmedEmail,
    token: trimmedCode,
    type: "recovery",
  });

  if (error) {
    console.error("Error en verifyOtp:", error.message);

    // Código expirado (Excepción E1 del CU-04)
    if (error.message.toLowerCase().includes("expired")) {
      return { error: "No se pudo validar el código ingresado." };
    }

    // Código incorrecto (Flujo alternativo 7a/8a del CU-04)
    return { error: "El código ingresado es incorrecto." };
  }

  return {
    success: true,
    message: "Código verificado correctamente.",
  };
}

// ─── Paso 3: Establecer nueva contraseña ───────────────────────────

export async function resetPassword(
  newPassword: string,
  confirmPassword: string
): Promise<RecoveryState> {
  if (!newPassword || !confirmPassword) {
    return { error: "Ambos campos de contraseña son obligatorios." };
  }

  // Flujo alternativo 9a/10a del CU-04: contraseñas no coinciden
  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  // Validar requisitos de seguridad (CU-04, paso 10)
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(newPassword)) {
      return { error: rule.message };
    }
  }

  const supabase = await createClient();

  // Verificar que la sesión de recovery esté activa
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha expirado. Por favor, solicita un nuevo código." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error en updateUser:", error.message);
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  }

  // Cerrar la sesión de recovery para forzar re-login con la nueva contraseña
  await supabase.auth.signOut();

  return {
    success: true,
    message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
  };
}
