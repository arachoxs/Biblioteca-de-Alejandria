import {
  sendRecoveryCode as sendRecoveryCodeModel,
  verifyRecoveryCode as verifyRecoveryCodeModel,
  resetPassword as resetPasswordModel,
} from "@/models/authModel";
import { AuthActionResult } from "@/lib/types/auth";

/**
 * Envía un código de recuperación al correo del usuario.
 * Delega al modelo de autenticación.
 */
export async function sendRecoveryCode(
  email: string
): Promise<AuthActionResult> {
  return sendRecoveryCodeModel(email);
}

/**
 * Verifica el código OTP de recuperación.
 * Delega al modelo de autenticación.
 */
export async function verifyRecoveryCode(
  email: string,
  code: string
): Promise<AuthActionResult> {
  return verifyRecoveryCodeModel(email, code);
}

/**
 * Establece una nueva contraseña y cierra la sesión.
 * Delega al modelo de autenticación.
 */
export async function resetPassword(
  newPassword: string
): Promise<AuthActionResult> {
  return resetPasswordModel(newPassword);
}
