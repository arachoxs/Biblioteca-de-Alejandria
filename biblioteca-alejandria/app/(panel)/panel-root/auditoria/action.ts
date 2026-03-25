"use server";

import { fetchAuditLogs } from "@/services/admin/auditService";
import type { AuditoriaResponse } from "@/lib/types/audit";

/**
 * Server Action: obtiene registros de auditoría paginados.
 */
export async function getAuditLogsAction(
  page: number = 1,
  pageSize: number = 10
): Promise<AuditoriaResponse> {
  return await fetchAuditLogs(page, pageSize);
}
