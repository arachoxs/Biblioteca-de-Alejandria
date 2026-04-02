"use server";

import { createAdminAccount, fetchAdminUsers, searchAdmins } from "@/services/admin/adminService";
import { type RegisterResponse, type UserStatusResult } from "@/lib/types/auth";
import type { AdminUsersResponse, AdminSearchResponse } from "@/lib/types/profile";
import { deshabilitarUsuario, habilitarUsuario } from "@/services/auth/authService";
import { sanitizeText, validateEmail, isValidUUID } from "@/lib/validations/rules";

/**
 * Crea un nuevo administrador.
 */
export async function createAdmin(email: string): Promise<RegisterResponse> {
    const cleanEmail = sanitizeText(email);

    if (!cleanEmail) {
        return { success: false, errors: { correo: "El correo electrónico es obligatorio." } };
    }

    const emailError = validateEmail(cleanEmail);
    if (emailError) {
        return { success: false, errors: { correo: emailError } };
    }

    return await createAdminAccount(cleanEmail);
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
    const cleanTerm = sanitizeText(searchTerm);
    return await searchAdmins(cleanTerm);
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

    // Validar formato UUID de cada ID
    const invalidIds = ids.filter((id) => !isValidUUID(id));
    if (invalidIds.length > 0) {
        return {
            success: false,
            message: "Uno o más IDs de usuario no son válidos.",
            errorIds: invalidIds,
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

    // Validar formato UUID de cada ID
    const invalidIds = ids.filter((id) => !isValidUUID(id));
    if (invalidIds.length > 0) {
        return {
            success: false,
            message: "Uno o más IDs de usuario no son válidos.",
            errorIds: invalidIds,
        };
    }

    return await habilitarUsuario(ids);
}
