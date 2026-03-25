"use server";

import { registerAuthUser } from "@/services/auth/registrationService";
import { fetchAdminUsers, searchAdmins } from "@/services/admin/adminService";
import { Rol, type CredentialData, type RegisterResponse, type AuthSignUpResult, type UserStatusResult } from "@/lib/types/auth";
import type { AdminUsersResponse, AdminSearchResponse } from "@/lib/types/profile";
import { deshabilitarUsuario, habilitarUsuario } from "@/services/auth/authService";
import { isCurrentUserRoot } from "@/models/authModel";


function generateRandomPassword(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    // Usamos el web crypto global para evitar problemas de compatibilidad
    const array = new Uint8Array(length);
    crypto.getRandomValues(array); 
    
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(array[i] % chars.length);
    }
    return password;
}


export async function createAdmin(email: string): Promise<RegisterResponse> {
    const password = generateRandomPassword(12);

    const credentialData: CredentialData = {
        correo: email,
        contrasena: password,
        confirmar_contrasena: password
    };

    const authResponse: AuthSignUpResult = await registerAuthUser(credentialData, Rol.ADMINISTRADOR);

    if (!authResponse.success) {
        return {
            success: false,
            errors: authResponse.errors,
            message: authResponse.message,
        };
    }

    return {
        success: true,
        message: `Administrador creado exitosamente.`,
    };
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
    // Verificar que el usuario actual sea ROOT
    const isRoot = await isCurrentUserRoot();
    
    if (!isRoot) {
        return {
            success: false,
            message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden deshabilitar administradores.",
            errorIds: Array.isArray(userIds) ? userIds : [userIds],
        };
    }

    // Si es ROOT, proceder con la deshabilitación
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
    // Verificar que el usuario actual sea ROOT
    const isRoot = await isCurrentUserRoot();
    
    if (!isRoot) {
        return {
            success: false,
            message: "No tienes permisos para realizar esta acción. Solo usuarios ROOT pueden habilitar administradores.",
            errorIds: Array.isArray(userIds) ? userIds : [userIds],
        };
    }

    // Si es ROOT, proceder con la habilitación
    return await habilitarUsuario(ids);
}
