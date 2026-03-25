import { updatePasswordWithVerification as updatePasswordModel , deactivateUsers, activateUsers } from "@/models/authModel";
import type { AuthActionResult , UserStatusResult } from "@/lib/types/auth";

/**
 * Cambia la contraseña del usuario autenticado.
 * Verifica la contraseña actual antes de aplicar el cambio.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<AuthActionResult> {
  return updatePasswordModel(currentPassword, newPassword);
}

export async function deshabilitarUsuario(userId: string[]): Promise<UserStatusResult> {
  return deactivateUsers(userId);
}

export async function habilitarUsuario(userId: string[]): Promise<UserStatusResult> {
  return activateUsers(userId);
}