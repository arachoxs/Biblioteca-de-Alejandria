import { getAdminUsers, searchAdminUsers, getCurrentUser } from "@/models/authModel";
import { registerAuthUser } from "@/services/auth/registrationService";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { Rol } from "@/lib/types/auth";
import type { AdminUsersResponse, AdminSearchResponse } from "@/lib/types/profile";
import type { CredentialData, RegisterResponse } from "@/lib/types/auth";

// ─── Helpers ────────────────────────────────────────────────────────

function generateRandomPassword(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  return password;
}

// ─── Escritura ──────────────────────────────────────────────────────

/**
 * Orquesta la creación completa de un administrador:
 * 1. Genera contraseña aleatoria.
 * 2. Registra al usuario vía `registrationService`.
 * 3. Registra la acción en la tabla de auditoría.
 *
 * El Server Action (`action.ts`) SOLO debe delegar aquí.
 */
export async function createAdminAccount(
  email: string
): Promise<RegisterResponse> {
  const cleanEmail = email.trim();
  const password = generateRandomPassword(12);

  const credentialData: CredentialData = {
    correo: cleanEmail,
    contrasena: password,
    confirmar_contrasena: password,
  };

  const authResponse = await registerAuthUser(
    credentialData,
    Rol.ADMINISTRADOR
  );

  if (!authResponse.success) {
    return {
      success: false,
      errors: authResponse.errors,
      message: authResponse.message,
    };
  }

  // ── Auditoría ─────────────────────────────────────────────────
  const newUserId = authResponse.data?.user?.id;
  const actor = await getCurrentUser();

  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.CREAR,
      description: `Se creó el administrador ${cleanEmail}.`,
      entity: { id_usuario_creado: newUserId ?? null, correo: cleanEmail },
    });
  }

  return {
    success: true,
    message: "Administrador creado exitosamente.",
  };
}

// ─── Lectura ────────────────────────────────────────────────────────

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
