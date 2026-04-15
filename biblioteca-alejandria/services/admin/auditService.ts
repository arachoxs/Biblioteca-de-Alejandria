import { insertAuditLog, getAuditLogs } from "@/models/auditModel";
import type { AccionAdministrador, AuditEntitySnapshot } from "@/lib/types/audit";
import type { AuditoriaResponse } from "@/lib/types/audit";

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Registra una acción administrativa en la tabla de auditoría.
 * Nunca lanza — fallos de auditoría no deben romper el flujo principal.
 */
export async function logAdminAction(params: {
  actorId: string;
  action: AccionAdministrador;
  description: string;
  entity: AuditEntitySnapshot;
}): Promise<void> {
  try {
    await insertAuditLog({
      fecha: new Date().toISOString(),
      accion: params.action,
      descripcion: params.description,
      entidad_afectada: params.entity,
      id_usuario: params.actorId,
    });
  } catch (error) {
    // Auditoría es best-effort: loguear pero no propagar
    console.error("[auditService] Error al registrar acción de auditoría:", error);
  }
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene registros de auditoría paginados para el panel.
 */
export async function fetchAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<AuditoriaResponse> {
  try {
    const { data, total } = await getAuditLogs(page, pageSize);
    const safePageSize = Math.max(1, pageSize);

    return {
      success: true,
      data: {
        data,
        total,
        page: Math.max(1, page),
        pageSize: safePageSize,
        totalPages: Math.ceil(total / safePageSize),
      },
    };
  } catch (error: unknown) {
    console.error("Error al obtener registros de auditoría:", error);
    return {
      success: false,
      message: "No se pudieron cargar los registros de auditoría.",
    };
  }
}
