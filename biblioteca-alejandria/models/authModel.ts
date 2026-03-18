import { createClient, createAdminClient } from "@/lib/supabase/server";
import { RecoveryState, Rol } from "@/lib/types/auth";
import type { AuthResponse } from "@supabase/supabase-js";

// ─── Tipos internos ────────────────────────────────────────────────

/** Respuesta interna de operaciones de registro en Supabase Auth. */
interface AuthSignUpResult {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  data?: AuthResponse["data"];
}

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
): Promise<RecoveryState> {
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
): Promise<RecoveryState> {
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
): Promise<RecoveryState> {
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
