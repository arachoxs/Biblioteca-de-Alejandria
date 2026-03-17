"use server";

import { RecoveryState } from "@/lib/types/auth";
import {
  sendRecoveryCodeModel,
  verifyRecoveryCodeModel,
  resetPasswordModel,
} from "@/models/authModel";

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

  return sendRecoveryCodeModel(trimmedEmail);
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

  return verifyRecoveryCodeModel(trimmedEmail, trimmedCode);
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

  return resetPasswordModel(newPassword);
}
