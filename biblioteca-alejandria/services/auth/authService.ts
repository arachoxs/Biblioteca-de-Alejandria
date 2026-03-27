import { updatePasswordWithVerification as updatePasswordModel, deactivateUsers, activateUsers, getCurrentUser } from "@/models/authModel";
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
 * Calcula los IDs procesados exitosamente comparando
 * la lista original contra los que fallaron.
 */
function getSuccessfulIds(allIds: string[], result: UserStatusResult): string[] {
  const errorSet = new Set(result.errorIds ?? []);
  return allIds.filter((id) => !errorSet.has(id));
}

/**
 * Registra en auditoría cada usuario afectado por una acción masiva.
 * Nunca lanza — la auditoría no debe romper el flujo principal.
 */
async function auditBulkAction(
  actorId: string,
  successIds: string[],
  description: string
): Promise<void> {
  await Promise.all(
    successIds.map((id) =>
      logAdminAction({
        actorId,
        action: AccionAdministrador.MODIFICAR,
        description,
        entity: { id_usuario_afectado: id },
      })
    )
  );
}

// ─── Deshabilitación / Habilitación ────────────────────────────────

export async function deshabilitarUsuario(userIds: string[]): Promise<UserStatusResult> {
  const actor = await getCurrentUser();

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
    const successIds = getSuccessfulIds(userIds, result);
    await auditBulkAction(actor.id, successIds, "Se deshabilitó al administrador.");
  }

  return result;
}

export async function habilitarUsuario(userIds: string[]): Promise<UserStatusResult> {
  const actor = await getCurrentUser();

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
    const successIds = getSuccessfulIds(userIds, result);
    await auditBulkAction(actor.id, successIds, "Se habilitó al administrador.");
  }

  return result;
}