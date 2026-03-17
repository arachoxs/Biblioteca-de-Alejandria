import { createClient } from "@/lib/supabase/server";
import { RecoveryState } from "@/lib/types/auth";

/**
 * Envía un código de recuperación (OTP) al correo del usuario.
 * Siempre devuelve éxito para no revelar si el correo existe (CU-04, flujo alternativo 4a).
 */
export async function sendRecoveryCode(email: string): Promise<RecoveryState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error en resetPasswordForEmail:", error);
  }

  // Seguridad: siempre responder igual para no revelar si el correo existe o no
  return {
    success: true,
    message: "Si el correo está registrado, recibirás un código de recuperación.",
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

  // Verificar que la sesión de recovery esté activa
  const { data, error: getUserError } = await supabase.auth.getUser();

  if (getUserError) {
    console.error("Error en getUser:", getUserError.message);
    return { error: "No se pudo verificar tu sesión. Intenta de nuevo." };
  }

  const { user } = data ?? {};

  if (!user) {
    return { error: "Tu sesión ha expirado. Por favor, solicita un nuevo código." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error en updateUser:", error);
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
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
