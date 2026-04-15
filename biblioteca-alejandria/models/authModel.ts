import "server-only";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { type AuthActionResult, Rol, type UserStatusResult } from "@/lib/types/auth";
import { redirect } from "next/navigation";
import type { AuthError, AuthResponse } from "@supabase/supabase-js";

import { escapeLikePattern, formatILIKE } from "@/lib/validations/db-utils";
import type { ModelResult } from "@/lib/types/common";
import type { AuthSignUpResult } from "@/lib/types/auth";
import { AdminUserFromView, PaginatedAdminUsers } from "@/lib/types/profile";


// ─── Registro ──────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario en Supabase Auth.
 *
 * El rol NO se envía en `options.data` (user_metadata) para evitar que
 * el usuario pueda editarlo. Un trigger de base de datos asigna
 * `CLIENTE` por defecto en `app_metadata`.
 */
export async function signUp(
  email: string,
  password: string,
  username: string | null
): Promise<AuthSignUpResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    console.error("Error al registrar en Supabase Auth:", error);

    if (
      error.message.toLowerCase().includes("already registered") ||
      error.status === 422
    ) {
      return {
        success: false,
        errors: { correo: "Este correo electrónico ya está registrado." },
      };
    }

    return {
      success: false,
      errors: { form: `Error en autenticación: ${error.message}` },
    };
  }

  return { success: true, data };
}

/**
 * Crea un usuario mediante el cliente de administración sin iniciar sesión automáticamente.
 * Ideal para la creación de administradores desde el panel.
 */
export async function adminSignUp(
  email: string,
  password: string,
  username: string | null
): Promise<AuthSignUpResult> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    console.error("Error al registrar en Supabase Auth via Admin:", error);

    if (
      error.message.toLowerCase().includes("already registered") ||
      error.status === 422
    ) {
      return {
        success: false,
        errors: { correo: "Este correo electrónico ya está registrado." },
      };
    }

    return {
      success: false,
      errors: { form: `Error en autenticación: ${error.message}` },
    };
  }

  return { success: true, data: { user: data.user, session: null } as AuthResponse["data"] };
}

/**
 * Asigna un rol distinto a `CLIENTE` en `app_metadata` usando el admin client.
 * Solo ROOT debería invocar esta operación.
 * Es correcto que la asignacion la realice adminClient
 */
export async function setUserRole(
  userId: string,
  rol: Rol
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: rol },
  });

  if (error) {
    console.error("Error al asignar rol en app_metadata:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Elimina un usuario de Supabase Auth. Usado como rollback en caso de
 * fallo durante el flujo de registro.
 * es correcto si se ejecuta desde el rollback debido a que es una operacion de limpieza de un usuario que no se pudo crear correctamente, y el adminClient tiene los permisos necesarios para eliminar cualquier usuario.
 */
export async function deleteAuthUser(userId: string): Promise<void> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error al eliminar usuario Auth (rollback):", error);
  }
}

// ─── Login ─────────────────────────────────────────────────────────

/**
 * Autentica un usuario con email y contraseña.
 * Retorna los datos de sesión o `null` en caso de error.
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse["data"] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error en signInWithPassword:", error);
    return null;
  }

  return data;
}

// ─── Recuperación de contraseña ────────────────────────────────────

/**
 * Envía un código de recuperación (OTP) al correo del usuario.
 * Excepción de seguridad: Si la cuenta de un administrador está deshabilitada temporalmente o suspendida,
 * revelará proactivamente un error de suspensión para mejorar la UX intencionalmente.
 * Para el resto de los escenarios (correos inexistentes, etc.), devolverá siempre éxito
 * para no revelar la existencia de la cuenta (CU-04, flujo alternativo 4a).
 */
export async function sendRecoveryCode(
  email: string
): Promise<AuthActionResult> {
  const adminClient = createAdminClient();

  // ─── Verificación temprana: cuenta de administrador deshabilitada ───
  // Se usa .ilike() con escape de caracteres en vez de .eq() para una comparación insensible a mayúsculas/minúsculas.
  const { data: adminData, error: adminQueryError } = await adminClient
    .from("vista_administradores")
    .select("habilitado")
    .ilike("email", escapeLikePattern(email))
    .maybeSingle();

  if (adminQueryError) {
    // Registrar el error para trazabilidad, pero no bloquear el flujo:
    // si la consulta falla, priorizamos disponibilidad del servicio.
    console.error(
      "[sendRecoveryCode] Error al consultar vista_administradores:",
      adminQueryError
    );
  }

  if (adminData && adminData.habilitado === false) {
    return {
      error:
        "Tu cuenta ha sido deshabilitada. Si crees que esto es un error, comunícate con el administrador principal del sistema.",
    };
  }

  // ─── Flujo estándar ─────────────────────────────────────────────────
  // Diferimos la inicialización del cliente SSR (cookies) para evitar su overhead 
  // en el caso en que la cuenta esté deshabilitada preventivamente.
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error en resetPasswordForEmail:", error);
  }

  // Seguridad: siempre responder igual para no revelar si el correo existe (excepto baneados)
  return {
    success: true,
    message:
      "Si el correo está registrado, recibirás un código de recuperación.",
  };
}

/**
 * Verifica el código OTP de recuperación contra Supabase Auth.
 */
export async function verifyRecoveryCode(
  email: string,
  code: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "recovery",
  });

  if (error) {
    console.error("Error en verifyOtp:", error);

    // Código expirado (Excepción E1 del CU-04)
    if (error.message.toLowerCase().includes("expired")) {
      return { error: "No se pudo validar el código ingresado." };
    }

    // Código incorrecto (Flujo alternativo 7a/8a del CU-04)
    return { error: "El código ingresado es incorrecto." };
  }

  return {
    success: true,
    message: "Código verificado correctamente.",
  };
}

/**
 * Establece una nueva contraseña para el usuario autenticado
 * con la sesión de recovery activa.
 *
 * No cierra sesión al terminar: el usuario queda logueado
 * y es redirigido a la app (auto-login intencional).
 */
export async function resetPassword(
  newPassword: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error: getUserError } = await supabase.auth.getUser();

  if (getUserError) {
    console.error("Error en getUser:", getUserError.message);
    return { error: "No se pudo verificar tu sesión. Intenta de nuevo." };
  }

  const { user } = data ?? {};

  if (!user) {
    return {
      error: "Tu sesión ha expirado. Por favor, solicita un nuevo código.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error en updateUser:", error);
    return {
      error: "No se pudo actualizar la contraseña. Intenta de nuevo.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada exitosamente.",
  };
}

/**
 * Cambia la contraseña del usuario autenticado verificando la actual.
 *
 * Flujo:
 * 1. Obtiene el email de la sesión activa.
 * 2. Re-autentica con `signInWithPassword` para verificar la contraseña actual.
 * 3. Actualiza la contraseña con `updateUser`.
 * 4. Cierra la sesión para forzar re-login.
 */
export async function updatePasswordWithVerification(
  currentPassword: string,
  newPassword: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  // 1. Obtener usuario actual
  const { data: userData, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !userData.user?.email) {
    console.error("Error en getUser:", getUserError?.message);
    return { error: "No se pudo verificar tu sesión. Inicia sesión de nuevo." };
  }

  // 2. Verificar contraseña actual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });

  if (signInError) {
    console.error("Error en signInWithPassword:", signInError);

    // Supabase puede fallar por credenciales inválidas u otros motivos (rate limit,
    // problemas de red, usuario sin password, etc.). Solo mostramos el mensaje
    // de contraseña incorrecta cuando claramente se trata de credenciales inválidas.
    if (signInError.status === 400) {
      return { error: "La contraseña actual es incorrecta." };
    }

    return {
      error:
        "No se pudo verificar la contraseña actual. Inténtalo de nuevo más tarde.",
    };
  }

  // 3. Actualizar contraseña
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Error en updateUser:", updateError);
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  }

  // 4. Cerrar sesión
  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error("Error en signOut:", signOutError.message);
    return {
      error:
        "Tu contraseña se actualizó, pero no se pudo cerrar la sesión correctamente. Por seguridad, cierra sesión manualmente.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada exitosamente.",
  };
}

// ─── Rol del usuario actual ────────────────────────────────────────

/** Valor centinela para usuarios no autenticados. */
export const VISITANTE = "VISITANTE" as const;

/**
 * Obtiene el usuario actual desde Supabase Auth.
 * Retorna `null` si no hay sesión activa.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

/**
 * Obtiene el rol del usuario actual desde `app_metadata`.
 * Si no hay sesión activa, retorna `VISITANTE`.
 */
export async function getCurrentUserRole(): Promise<Rol | typeof VISITANTE> {
  const user = await getCurrentUser();

  if (!user) return VISITANTE;

  const role = (user.app_metadata as Record<string, unknown>)?.role;

  if (role === Rol.ROOT || role === Rol.ADMINISTRADOR || role === Rol.CLIENTE) {
    return role;
  }

  return VISITANTE;
}

/**
 * Obtiene el email del usuario actual, o `null` si no hay sesión.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}

// ─── Cierre de sesión global ───────────────────────────────────────

/**
 * Cierra la sesión del usuario en **todos** los dispositivos
 * y redirige a la página principal.
 */
export async function globalSignOutModel(): Promise<void> {
  const signOutError = await signOutModel();

  if(signOutError){
    throw new Error("Error al cerrar sesión globalmente: " + signOutError.message);
  }

  redirect("/");
}

// singout dedicado

export async function signOutModel(): Promise<AuthError | null> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error al cerrar sesión:", error);
    return error;
  }

  return null
}

//obtencion de usuarios administradores paginados para el panel de administradores

/**
 * Obtiene todos los usuarios con rol ADMINISTRADOR paginados.
 * 
 * @param page - Número de página (comienza en 1)
 * @param pageSize - Cantidad de resultados por página (por defecto 10)
 * @returns Listado paginado de usuarios administradores con sus nombres
 */
export async function getAdminUsers(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedAdminUsers> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  // ¡Consultamos la VISTA como si fuera una tabla normal!
  const { data, error, count } = await adminClient
    .from("vista_administradores") // El nombre que le dimos en SQL
    .select("*", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Filtramos filas con id null (no deberían existir en auth.users,
  // pero lo garantizamos aquí para que el tipo AdminUserFromView sea seguro).
  const safeData = (data || []).filter(
    (row): row is AdminUserFromView => row.id !== null
  );

  return {
    data: safeData,
    total: count || 0,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil((count || 0) / safePageSize),
  };
}

/**
 * Busca administradores por correo, nombre o apellidos.
 * 
 * @param searchTerm - Término de búsqueda a aplicar en email, nombres o apellidos
 * @returns Listado de administradores que coinciden con el término de búsqueda
 */
export async function searchAdminUsers(
  searchTerm: string
): Promise<AdminUserFromView[]> {
  const adminClient = createAdminClient();

  const normalizedSearch = formatILIKE(searchTerm);

  const { data, error } = await adminClient
    .from("vista_administradores")
    .select("*")
    .or(
      `email.ilike.${normalizedSearch},nombre_completo.ilike.${normalizedSearch}`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Filtramos filas con id null
  const safeData = (data || []).filter(
    (row): row is AdminUserFromView => row.id !== null
  );

  return safeData;
}

// ─── Activación/Desactivación de usuarios ─────────────────────────────

/**
 * Desactiva uno o múltiples usuarios mediante ban de auth indefinido.
 * Verifica que los usuarios no estén ya desactivados antes de proceder.
 * 
 * El ban es indefinido (100 años) para simular una desactivación permanente
 * hasta que se active manualmente.
 * 
 * @param userIds - ID o array de IDs de usuarios a desactivar
 * @returns Resultado con mensaje y array de IDs que fallaron (si aplica)
 */
export async function deactivateUsers(
  userIds: string | string[]
): Promise<UserStatusResult> {
  const adminClient = createAdminClient();
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const errorIds: string[] = [];
  let successCount = 0;
  let alreadyBannedCount = 0;

  try {
    await Promise.all(
      ids.map(async (userId) => {
        try {
          // 1. Verificar el estado actual del usuario
          const { data: user, error: getUserError } =
            await adminClient.auth.admin.getUserById(userId);

          if (getUserError) {
            console.error(`Error al obtener usuario ${userId}:`, getUserError);
            errorIds.push(userId);
            return;
          }

          if (!user || !user.user) {
            errorIds.push(userId);
            return;
          }

          // 2. Verificar si ya está baneado
          if (user.user.banned_until) {
            const bannedUntil = new Date(user.user.banned_until);
            const now = new Date();

            // Si banned_until es en el futuro, el usuario ya está baneado
            if (bannedUntil > now) {
              alreadyBannedCount++;
              return;
            }
          }

          // 3. Desactivar el usuario indefinidamente (876000h ≈ 100 años)
          const { error: banError } = await adminClient.auth.admin.updateUserById(
            userId,
            { ban_duration: '876000h' }
          );

          if (banError) {
            console.error(`Error al desactivar usuario ${userId}:`, banError);
            errorIds.push(userId);
            return;
          }

          successCount++;
        } catch (error) {
          console.error(`Excepción al procesar usuario ${userId}:`, error);
          errorIds.push(userId);
        }
      })
    );

    // Generar mensaje y resultado
    if (errorIds.length === 0 && successCount === 0 && alreadyBannedCount === ids.length) {
      return {
        success: true,
        message: `Todos los usuarios ya estaban desactivados (${alreadyBannedCount})`,
      };
    }

    if (errorIds.length === ids.length) {
      return {
        success: false,
        message: "No se pudo desactivar ningún usuario",
        errorIds,
      };
    }

    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} desactivado(s)`);
    if (alreadyBannedCount > 0) parts.push(`${alreadyBannedCount} ya desactivado(s)`);
    if (errorIds.length > 0) parts.push(`${errorIds.length} fallido(s)`);

    return {
      success: successCount > 0 || alreadyBannedCount > 0,
      message: parts.join(", "),
      errorIds: errorIds.length > 0 ? errorIds : undefined,
    };
  } catch (error) {
    console.error("Error general en deactivateUsers:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
      errorIds: ids,
    };
  }
}

/**
 * Activa uno o múltiples usuarios removiendo el ban de auth.
 * Verifica que los usuarios estén desactivados antes de proceder.
 * 
 * @param userIds - ID o array de IDs de usuarios a activar
 * @returns Resultado con mensaje y array de IDs que fallaron (si aplica)
 */
export async function activateUsers(
  userIds: string | string[]
): Promise<UserStatusResult> {
  const adminClient = createAdminClient();
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  if (ids.length === 0) {
    return {
      success: false,
      message: "No se proporcionaron IDs de usuarios.",
    };
  }

  const errorIds: string[] = [];
  let successCount = 0;
  let alreadyActiveCount = 0;

  try {
    await Promise.all(
      ids.map(async (userId) => {
        try {
          // 1. Verificar el estado actual del usuario
          const { data: user, error: getUserError } =
            await adminClient.auth.admin.getUserById(userId);

          if (getUserError) {
            console.error(`Error al obtener usuario ${userId}:`, getUserError);
            errorIds.push(userId);
            return;
          }

          if (!user || !user.user) {
            errorIds.push(userId);
            return;
          }

          // 2. Verificar si ya está activo (no baneado)
          if (!user.user.banned_until) {
            alreadyActiveCount++;
            return;
          }

          const bannedUntil = new Date(user.user.banned_until);
          const now = new Date();

          // Si banned_until es en el pasado, el usuario ya está activo
          if (bannedUntil <= now) {
            alreadyActiveCount++;
            return;
          }

          // 3. Activar el usuario (removiendo el ban con 'none')
          const { error: unbanError } = await adminClient.auth.admin.updateUserById(
            userId,
            { ban_duration: 'none' }
          );

          if (unbanError) {
            console.error(`Error al activar usuario ${userId}:`, unbanError);
            errorIds.push(userId);
            return;
          }

          successCount++;
        } catch (error) {
          console.error(`Excepción al procesar usuario ${userId}:`, error);
          errorIds.push(userId);
        }
      })
    );

    // Generar mensaje y resultado
    if (errorIds.length === 0 && successCount === 0 && alreadyActiveCount === ids.length) {
      return {
        success: true,
        message: `Todos los usuarios ya estaban activos (${alreadyActiveCount})`,
      };
    }

    if (errorIds.length === ids.length) {
      return {
        success: false,
        message: "No se pudo activar ningún usuario",
        errorIds,
      };
    }

    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} activado(s)`);
    if (alreadyActiveCount > 0) parts.push(`${alreadyActiveCount} ya activo(s)`);
    if (errorIds.length > 0) parts.push(`${errorIds.length} fallido(s)`);

    return {
      success: successCount > 0 || alreadyActiveCount > 0,
      message: parts.join(", "),
      errorIds: errorIds.length > 0 ? errorIds : undefined,
    };
  } catch (error) {
    console.error("Error general en activateUsers:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
      errorIds: ids,
    };
  }
}
