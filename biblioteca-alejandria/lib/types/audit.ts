import type { Json } from "./supabase";

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

export interface PaginatedAuditoria {
    data: AuditoriaRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface AuditoriaResponse {
    success: boolean;
    data?: PaginatedAuditoria;
    message?: string;
}
