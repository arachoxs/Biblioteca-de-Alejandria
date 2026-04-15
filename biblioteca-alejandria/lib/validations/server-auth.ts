import "server-only";
import { getCurrentUserRole } from "@/models/authModel";
import { Rol } from "@/lib/types/auth";
import type { ActionResponse } from "@/lib/types/common";

// ─── Guards de rol ─────────────────────────────────────────────────

/**
 * Verifica si el usuario actual tiene rol ROOT.
 * Retorna `true` si es ROOT, `false` de lo contrario.
 */
export async function isCurrentUserRoot(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === Rol.ROOT;
}

/**
 * Verifica si el usuario actual tiene rol ADMINISTRADOR.
 * Retorna `true` si es ADMINISTRADOR, `false` de lo contrario.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === Rol.ADMINISTRADOR;
}

/**
 * Verifica si el usuario actual tiene rol CLIENTE.
 * Retorna `true` si es CLIENTE, `false` de lo contrario.
 */
export async function isCurrentUserClient(): Promise<boolean> {
    const role = await getCurrentUserRole();
    return role === Rol.CLIENTE;
}

/**
 * Requiere rol ROOT. Retorna error si no lo tiene.
 */
export async function requireRootRole(): Promise<ActionResponse> {
    const role = await getCurrentUserRole();

    if (role !== Rol.ROOT) {
        return {
            success: false,
            message: "No tienes permisos para realizar esta acción.",
        };
    }

    return { success: true };
}

/**
 * Requiere rol ADMINISTRADOR. Retorna error si no lo tiene.
 */
export async function requireAdminRole(): Promise<ActionResponse> {
    const role = await getCurrentUserRole();

    if (role !== Rol.ADMINISTRADOR) {
        return {
            success: false,
            message: "No tienes permisos para realizar esta acción.",
        };
    }

    return { success: true };
}

/**
 * Requiere rol CLIENTE. Retorna error si no lo tiene.
 */
export async function requireClientRole(): Promise<ActionResponse> {
    const role = await getCurrentUserRole();

    if (role !== Rol.CLIENTE) {
        return {
            success: false,
            message: "No tienes permisos para realizar esta acción.",
        };
    }

    return { success: true };
}
