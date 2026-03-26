import { createAdminClient } from "@/lib/supabase/server";
import type { AuditoriaRow, AuditLogPayload } from "@/lib/types/audit";

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Inserta un registro de auditoría en la tabla `auditoria`.
 * Nunca lanza — loguea en consola y retorna silenciosamente.
 */
export async function insertAuditLog(payload: AuditLogPayload): Promise<void> {
  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.from("auditoria").insert({
      fecha: payload.fecha,
      accion: payload.accion,
      descripcion: payload.descripcion,
      entidad_afectada: payload.entidad_afectada,
      id_usuario: payload.id_usuario,
    });

    if (error) {
      console.error("Error al insertar registro de auditoría:", error);
    }
  } catch (err) {
    console.error("Excepción al insertar registro de auditoría:", err);
  }
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene registros de auditoría paginados, ordenados por fecha descendente.
 */
export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: AuditoriaRow[]; total: number }> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, error, count } = await adminClient
    .from("auditoria")
    .select("*", { count: "exact" })
    .order("fecha", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data || []) as AuditoriaRow[],
    total: count || 0,
  };
}
