import { getAdminUsers, searchAdminUsers } from "@/models/authModel";
import type { AdminUsersResponse, AdminSearchResponse } from "@/lib/types/profile";

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

/**
 * Servicio para buscar usuarios administradores por correo, nombre o apellidos.
 * 
 * Orquesta la llamada al modelo y maneja posibles errores.
 * 
 * @param searchTerm - Término de búsqueda para filtrar administradores
 * @returns Respuesta con listado de usuarios administradores que coinciden con la búsqueda
 */
export async function searchAdmins(
  searchTerm: string
): Promise<AdminSearchResponse> {
  try {
    // Validación básica del término de búsqueda
    if (!searchTerm || searchTerm.trim().length === 0) {
      return {
        success: false,
        errors: { search: "El término de búsqueda no puede estar vacío." },
        message: "Por favor ingresa un término de búsqueda válido.",
      };
    }

    const result = await searchAdminUsers(searchTerm);
    
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    console.error("Error al buscar usuarios administradores:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return {
      success: false,
      errors: { form: errorMessage },
      message: "No se pudo realizar la búsqueda de administradores.",
    };
  }
}
