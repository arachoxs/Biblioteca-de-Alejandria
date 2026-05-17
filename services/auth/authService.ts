import { updatePasswordWithVerification as updatePasswordModel, deactivateUsers, activateUsers, getCurrentUser, setPreferencesOnboardingComplete as setPreferencesOnboardingCompleteModel } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { Rol } from "@/lib/types/auth";
import type { AuthActionResult, UserStatusResult } from "@/lib/types/auth";

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

// ─── Helpers internos ──────────────────────────────────────────────

/**
 * Calcula los usuarios procesados exitosamente comparando
 * la lista original contra los IDs que fallaron.
 */
function getSuccessfulUsers(allUsers: {id: string, email: string}[], result: UserStatusResult): {id: string, email: string}[] {
  const errorSet = new Set(result.errorIds ?? []);
  return allUsers.filter((u) => !errorSet.has(u.id));
}

/**
 * Registra en auditoría cada usuario afectado por una acción masiva.
 * Nunca lanza — la auditoría no debe romper el flujo principal.
 */
async function auditBulkAction(
  actorId: string,
  successUsers: {id: string, email: string}[],
  description: string
): Promise<void> {
  await Promise.all(
    successUsers.map((u) =>
      logAdminAction({
        actorId,
        action: AccionAdministrador.MODIFICAR,
        description,
        entity: { id: u.id, entity_type: "administrador", display_name: u.email },
      })
    )
  );
}

// ─── Deshabilitación / Habilitación ────────────────────────────────

export async function deshabilitarUsuario(users: {id: string, email: string}[]): Promise<UserStatusResult> {
  const actor = await getCurrentUser();
  const userIds = users.map(u => u.id);

  if (!actor || actor.app_metadata?.role !== Rol.ROOT) {
    return {
      success: false,
      message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden deshabilitar administradores.",
      errorIds: userIds,
    };
  }

  const result = await deactivateUsers(userIds);

  // ── Auditoría ─────────────────────────────────────────────────
  if (result.success) {
    const successUsers = getSuccessfulUsers(users, result);
    await auditBulkAction(actor.id, successUsers, "Se deshabilitó al administrador.");
  }

return result;
}

export async function setPreferencesOnboardingComplete(
  userId: string
): Promise<AuthActionResult> {
  return setPreferencesOnboardingCompleteModel(userId);
}

export async function habilitarUsuario(users: {id: string, email: string}[]): Promise<UserStatusResult> {
  const actor = await getCurrentUser();
  const userIds = users.map(u => u.id);

  if (!actor || actor.app_metadata?.role !== Rol.ROOT) {
    return {
      success: false,
      message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden habilitar administradores.",
      errorIds: userIds,
    };
  }

  const result = await activateUsers(userIds);

  // ── Auditoría ─────────────────────────────────────────────────
  if (result.success) {
    const successUsers = getSuccessfulUsers(users, result);
    await auditBulkAction(actor.id, successUsers, "Se habilitó al administrador.");
  }

  return result;
}