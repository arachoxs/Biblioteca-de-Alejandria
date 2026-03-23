"use server";

import { registerAuthUser } from "@/services/auth/registrationService";
import { fetchAdminUsers } from "@/services/admin/adminService";
import { Rol, type CredentialData, type RegisterResponse, type AuthSignUpResult } from "@/lib/types/auth";
import type { AdminUsersResponse } from "@/lib/types/profile";


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