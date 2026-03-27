"use server";

import { createAdminAccount, fetchAdminUsers, searchAdmins } from "@/services/admin/adminService";
import { type RegisterResponse, type UserStatusResult } from "@/lib/types/auth";
import type { AdminUsersResponse, AdminSearchResponse } from "@/lib/types/profile";
import { deshabilitarUsuario, habilitarUsuario } from "@/services/auth/authService";

/**
 * Crea un nuevo administrador.
 * Delega toda la lógica de negocio (registro + auditoría) al servicio.
 */
export async function createAdmin(email: string): Promise<RegisterResponse> {
    return await createAdminAccount(email);
}

/**
 * Obtiene la lista paginada de usuarios administradores.
 * 
 * @param page - Número de página (comienza en 1)
 * @param pageSize - Cantidad de resultados por página
 * @returns Respuesta con datos paginados de administradores
 */
export async function getAdmins(
    page: number = 1,
    pageSize: number = 10
): Promise<AdminUsersResponse> {
    return await fetchAdminUsers(page, pageSize);
}

/**
 * Busca administradores por correo electrónico, nombre o apellidos.
 * 
 * @param searchTerm - Término de búsqueda para filtrar administradores
 * @returns Respuesta con listado de administradores que coinciden con la búsqueda
 */
export async function searchAdminsByTerm(
    searchTerm: string
): Promise<AdminSearchResponse> {
    return await searchAdmins(searchTerm);
}

/**
 * Deshabilita uno o múltiples administradores.
 * 
 * Solo usuarios con rol ROOT pueden ejecutar esta acción.
 * 
 * @param userIds - ID o array de IDs de usuarios a deshabilitar
 * @returns Resultado de la operación con errorIds si aplica
 */
export async function deshabilitarAdministradores(
    userIds: string | string[]
): Promise<UserStatusResult> {
    const ids = Array.isArray(userIds) ? userIds : [userIds];

    if (ids.length === 0) {
        return {
            success: false,
            message: "No se proporcionaron IDs de usuarios para deshabilitar.",
        };
    }

    return await deshabilitarUsuario(ids);
}

/**
 * Habilita uno o múltiples administradores.
 * 
 * Solo usuarios con rol ROOT pueden ejecutar esta acción.
 * 
 * @param userIds - ID o array de IDs de usuarios a habilitar
 * @returns Resultado de la operación con errorIds si aplica
 */
export async function habilitarAdministradores(
    userIds: string | string[]
): Promise<UserStatusResult> {
    const ids = Array.isArray(userIds) ? userIds : [userIds];

    if (ids.length === 0) {
        return {
            success: false,
            message: "No se proporcionaron IDs de usuarios para habilitar.",
        };
    }

    return await habilitarUsuario(ids);
}
