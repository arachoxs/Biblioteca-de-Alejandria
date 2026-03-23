import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AuthActionResult, Rol } from "@/lib/types/auth";
import { redirect } from "next/navigation";
import type { AuthResponse } from "@supabase/supabase-js";

// ─── Tipos internos ────────────────────────────────────────────────

/** Respuesta interna de operaciones de registro en Supabase Auth. */
import type { AuthSignUpResult } from "@/lib/types/auth";

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
 * Asigna un rol distinto a `CLIENTE` en `app_metadata` usando el admin client.
 * Solo ROOT debería invocar esta operación.
 */
export async function setUserRole(
  userId: string,
  rol: Rol
): Promise<{ success: boolean; error?: string }> {
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

// ─── Verificación de permisos ──────────────────────────────────────

/**
 * Verifica que el usuario actual tenga rol ROOT.
 * Retorna `true` si es ROOT, `false` de lo contrario.
 */
export async function isCurrentUserRoot(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.app_metadata?.role === Rol.ROOT;
}

// ─── Recuperación de contraseña ────────────────────────────────────

/**
 * Envía un código de recuperación (OTP) al correo del usuario.
 * Siempre devuelve éxito para no revelar si el correo existe (CU-04, flujo alternativo 4a).
 */
export async function sendRecoveryCode(
  email: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error en resetPasswordForEmail:", error);
  }

  // Seguridad: siempre responder igual para no revelar si el correo existe
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
 * con la sesión de recovery activa, y cierra la sesión al terminar.
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

  // Cerrar la sesión de recovery para forzar re-login con la nueva contraseña
  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    console.error("Error en signOut:", signOutError.message);
    return {
      error:
        "Tu contraseña se actualizó, pero no se pudo cerrar la sesión correctamente. Por seguridad, intenta cerrar sesión e iniciar nuevamente.",
    };
  }

  return {
    success: true,
    message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
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
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    console.error("Error al cerrar sesión globalmente:", error);
    throw error;
  }

  redirect("/");
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
