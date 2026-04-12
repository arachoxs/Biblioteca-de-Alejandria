import type { Json } from "./supabase";
import type { Paginated, PaginatedResponse } from "./common";

/** Snapshot genérico de la entidad auditada */
export interface AuditEntitySnapshot {
  id: string;
  entity_type: string;
  display_name: string;
  [key: string]: any;
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

export interface AuditoriaRow {
    id: number;
    fecha: string;
    accion: AccionAdministrador;
    descripcion: string;
    entidad_afectada: AuditEntitySnapshot;
    id_usuario: string | null;
    actor_email?: string; // Resuelto en tiempo de lectura
}

/**
 * Datos paginados de auditoría.
 */
export type PaginatedAuditoria = Paginated<AuditoriaRow>;

/**
 * Respuesta paginada de registros de auditoría.
 */
export type AuditoriaResponse = PaginatedResponse<AuditoriaRow>;
