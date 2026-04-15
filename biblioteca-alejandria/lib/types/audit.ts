import type { Database, Json } from "@/lib/types/supabase";
import type { Paginated, PaginatedResponse } from "./common";

/** Fila base de la tabla `auditoria` desde tipos generados de Supabase. */
type AuditoriaDbRow = Database["public"]["Tables"]["auditoria"]["Row"];

/** Snapshot genérico de la entidad auditada */
export interface AuditEntitySnapshot {
  id: string;
  entity_type: string;
  display_name: string;
  [key: string]: Json | undefined;
}

/** Enum principal de las acciones auditables (refleja el enum de DB) */
export enum AccionAdministrador {
    CREAR = "crear",
    MODIFICAR = "modificar",
    ELIMINAR = "eliminar",
}

export interface AuditLogPayload {
    fecha: string;
    accion: AccionAdministrador;
    descripcion: string;
    entidad_afectada: AuditEntitySnapshot;
    id_usuario: string | null;
}

export type AuditoriaRow = Omit<AuditoriaDbRow, "entidad_afectada"> & {
    entidad_afectada: AuditEntitySnapshot;
    actor_email?: string; // Resuelto en tiempo de lectura
};

/**
 * Datos paginados de auditoría.
 */
export type PaginatedAuditoria = Paginated<AuditoriaRow>;

/**
 * Respuesta paginada de registros de auditoría.
 */
export type AuditoriaResponse = PaginatedResponse<AuditoriaRow>;
