import { getAdminUsers } from "@/models/authModel";
import type { AdminUsersResponse } from "@/lib/types/profile";

/**
 * Servicio para obtener usuarios administradores paginados.
 * 
 * Orquesta la llamada al modelo y maneja posibles errores.
 * 
 * @param page - Número de página (comienza en 1)
 * @param pageSize - Cantidad de resultados por página (por defecto 10)
 * @returns Respuesta con listado paginado de usuarios administradores
 */
export async function fetchAdminUsers(
  page: number = 1,
  pageSize: number = 10
): Promise<AdminUsersResponse> {
  try {
    const result = await getAdminUsers(page, pageSize);
    
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Error al obtener usuarios administradores:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudieron cargar los usuarios administradores.",
    };
  }
}
