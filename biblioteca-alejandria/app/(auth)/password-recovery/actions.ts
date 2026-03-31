"use server";

import { AuthActionResult } from "@/lib/types/auth";
import {
  sendRecoveryCode as sendRecoveryCodeService,
  verifyRecoveryCode as verifyRecoveryCodeService,
  resetPassword as resetPasswordService,
} from "@/services/auth/recoveryService";
import { validatePasswordRule, sanitizeText, validateEmail } from "@/lib/validations/auth";

// ─── Constantes de validación ──────────────────────────────────────

const OTP_LENGTH = 8;

// ─── Paso 1: Enviar código de recuperación ─────────────────────────

export async function sendRecoveryCode(
  email: string
): Promise<AuthActionResult> {
  const trimmedEmail = sanitizeText(email);

  if (!trimmedEmail) {
    return { error: "El correo electrónico es obligatorio." };
  }

  const emailError = validateEmail(trimmedEmail);
  if (emailError) return { error: emailError };

  return sendRecoveryCodeService(trimmedEmail);
}

// ─── Paso 2: Verificar código OTP ──────────────────────────────────

export async function verifyRecoveryCode(
  email: string,
  code: string
): Promise<AuthActionResult> {
  const trimmedEmail = sanitizeText(email);
  const trimmedCode = code?.trim();

  if (!trimmedEmail || !trimmedCode) {
    return { error: "El correo y el código son obligatorios." };
  }

  if (trimmedCode.length !== OTP_LENGTH || !/^\d+$/.test(trimmedCode)) {
    return { error: "El código debe ser de 8 dígitos numéricos." };
  }

  return verifyRecoveryCodeService(trimmedEmail, trimmedCode);
}

// ─── Paso 3: Establecer nueva contraseña ───────────────────────────

export async function resetPassword(
  newPassword: string,
  confirmPassword: string
): Promise<AuthActionResult> {
  if (!newPassword || !confirmPassword) {
    return { error: "Ambos campos de contraseña son obligatorios." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const passwordError = validatePasswordRule(newPassword);
  if (passwordError) return { error: passwordError };

  return resetPasswordService(newPassword);
}
