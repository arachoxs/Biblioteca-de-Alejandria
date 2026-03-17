import { createClient } from "@/lib/supabase/server";
import { RecoveryState } from "@/lib/types/auth";

/**
 * Envía un código de recuperación (OTP) al correo del usuario.
 * Siempre devuelve éxito para no revelar si el correo existe (CU-04, flujo alternativo 4a).
 */
export async function sendRecoveryCodeModel(email: string): Promise<RecoveryState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("Error en resetPasswordForEmail:", error.message);
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
export async function verifyRecoveryCodeModel(
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
    console.error("Error en verifyOtp:", error.message);

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
export async function resetPasswordModel(
  newPassword: string
): Promise<RecoveryState> {
  const supabase = await createClient();

  // Verificar que la sesión de recovery esté activa
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu sesión ha expirado. Por favor, solicita un nuevo código." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error en updateUser:", error.message);
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  }

  // Cerrar la sesión de recovery para forzar re-login con la nueva contraseña
  await supabase.auth.signOut();

  return {
    success: true,
    message: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión.",
  };
}
