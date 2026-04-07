import type { Json } from "./supabase";
import type { Paginated, PaginatedResponse } from "./common";

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
    entidad_afectada: Json;
    id_usuario: string | null;
}

export interface AuditoriaRow {
    id: number;
    fecha: string;
    accion: AccionAdministrador;
    descripcion: string;
    entidad_afectada: Json;
    id_usuario: string | null;
}

/**
 * Datos paginados de auditoría.
 */
export type PaginatedAuditoria = Paginated<AuditoriaRow>;

/**
 * Respuesta paginada de registros de auditoría.
 */
export type AuditoriaResponse = PaginatedResponse<AuditoriaRow>;
