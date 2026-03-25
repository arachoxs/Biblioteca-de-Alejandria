import { updatePasswordWithVerification as updatePasswordModel , deactivateUsers, activateUsers, isCurrentUserRoot } from "@/models/authModel";
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

export async function deshabilitarUsuario(userIds: string[]): Promise<UserStatusResult> {
    // Si es ROOT, proceder con la habilitación
  const isRoot = await isCurrentUserRoot();
    
  if (!isRoot) {
      return {
          success: false,
          message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden deshabilitar administradores.",
          errorIds: userIds
      };
  }

  return deactivateUsers(userIds);
}

export async function habilitarUsuario(userIds:string[]): Promise<UserStatusResult> {
    // Si es ROOT, proceder con la habilitación
  const isRoot = await isCurrentUserRoot();
      
  if (!isRoot) {
      return {
          success: false,
          message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden habilitar administradores.",
          errorIds: userIds
      };
  }

  return activateUsers(userIds);
}