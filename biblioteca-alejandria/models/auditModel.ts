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
      entidad_afectada: payload.entidad_afectada as any, // Cast a Json
      id_usuario: payload.id_usuario,
    });

    if (error) {
      console.error("[auditModel] Error al insertar registro de auditoría:", error);
    }
  } catch (err) {
    console.error("[auditModel] Excepción al insertar registro de auditoría:", err);
  }
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene registros de auditoría paginados, ordenados por fecha descendente.
 * Resuelve el correo del actor cruzando con la vista de administradores.
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

  // Supabase no permite un simple JOIN a una vista en otro schema o si no hay FK formal.
  // Pero auditoria sí tiene id_usuario apuntando a auth.users, el cual es el mismo de vista_administradores(id).
  // Si no hay FK a vista_administradores, resolvemos haciendo IN.

  const { data: auditData, error, count } = await adminClient
    .from("auditoria")
    .select("*", { count: "exact" })
    .order("fecha", { ascending: false })
    .range(from, to);

  if (error) throw error;
  if (!auditData) return { data: [], total: count || 0 };

  const logs = auditData as AuditoriaRow[];
  const userIds = [...new Set(logs.map(log => log.id_usuario).filter(Boolean))] as string[];

  let adminEmailsMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: admins } = await adminClient
      .from("vista_administradores")
      .select("id, email")
      .in("id", userIds);

    if (admins) {
      adminEmailsMap = admins.reduce((acc, admin) => {
        if (admin.id && admin.email) acc[admin.id] = admin.email;
        return acc;
      }, {} as Record<string, string>);
    }

    // Buscar correos de usuarios faltantes (ej: usuario ROOT que no está en la vista)
    const missingIds = userIds.filter(id => !adminEmailsMap[id]);
    if (missingIds.length > 0) {
      await Promise.all(
        missingIds.map(async (id) => {
          const { data } = await adminClient.auth.admin.getUserById(id);
          if (data?.user?.email) {
            adminEmailsMap[id] = data.user.email;
          }
        })
      );
    }
  }

  const resolvedLogs = logs.map(log => ({
    ...log,
    actor_email: log.id_usuario ? adminEmailsMap[log.id_usuario] || "Desconocido" : "Sistema",
  }));

  return {
    data: resolvedLogs,
    total: count || 0,
  };
}
