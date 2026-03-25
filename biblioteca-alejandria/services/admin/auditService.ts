import { insertAuditLog, getAuditLogs } from "@/models/auditModel";
import { AccionAdministrador } from "@/lib/types/audit";
import type { AuditoriaResponse } from "@/lib/types/audit";
import type { Json } from "@/lib/types/supabase";

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Registra una acción administrativa en la tabla de auditoría.
 * Recibe el ID del actor (admin que ejecuta), la acción, una descripción
 * legible y un snapshot de la entidad afectada.
 *
 * Nunca lanza — la auditoría no debe romper el flujo principal.
 */
export async function logAdminAction(params: {
  actorId: string;
  action: AccionAdministrador;
  description: string;
  entity: Json;
}): Promise<void> {
  await insertAuditLog({
    fecha: new Date().toISOString(),
    accion: params.action,
    descripcion: params.description,
    entidad_afectada: params.entity,
    id_usuario: params.actorId,
  });
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
