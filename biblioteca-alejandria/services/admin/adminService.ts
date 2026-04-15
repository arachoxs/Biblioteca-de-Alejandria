import { getAdminUsers, getCurrentUser } from "@/models/authModel";
import { requireRootRole } from "@/lib/validations/server-auth";
import { registerAuthUser } from "@/services/auth/registrationService";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { Rol } from "@/lib/types/auth";
import type { AdminUsersResponse } from "@/lib/types/profile";
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
  const roleCheck = await requireRootRole();

  if (!roleCheck.success) {
    return {
      ...roleCheck
    };
  }


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
      entity: { id: newUserId ?? "desconocido", entity_type: "administrador", display_name: cleanEmail },
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
  pageSize: number = 10,
  searchTerm?: string
): Promise<AdminUsersResponse> {
  try {
    const roleCheck = await requireRootRole();
    
    if (!roleCheck.success) {
      return {
        ...roleCheck}
    };

    const result = await getAdminUsers(page, pageSize, searchTerm);
    
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

