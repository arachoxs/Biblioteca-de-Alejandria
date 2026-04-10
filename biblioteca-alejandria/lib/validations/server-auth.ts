import "server-only";
import { getCurrentUserRole } from "@/models/authModel";
import { Rol } from "@/lib/types/auth";
import type { ActionResponse } from "@/lib/types/common";

/**
 * Verifica que el usuario actual tenga rol ADMINISTRADOR.
 * Retorna ActionResponse con error si no tiene permisos.
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
