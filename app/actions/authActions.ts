"use server";

import { globalSignOutModel, getCurrentUser } from "@/models/authModel";
import { changePassword, setPreferencesOnboardingComplete } from "@/services/auth/authService";
import { validatePasswordRule } from "@/lib/validations/rules";
import type { AuthActionResult } from "@/lib/types/auth";
import type { ActionResponse } from "@/lib/types/common";

/**
 * Server Action: cierra la sesión del usuario en todos los dispositivos.
 * Internamente delega a `globalSignOutModel()` que ejecuta el sign-out
 * con scope "global" y redirige al inicio.
 */
export async function globalSignOutAction(): Promise<void> {
  await globalSignOutModel();
}

/**
 * Server Action: cambia la contraseña del usuario autenticado.
 *
 * Valida los campos, verifica la contraseña actual y actualiza.
 * Al finalizar, cierra la sesión del usuario.
 */
export async function changePasswordAction(
  formData: FormData
): Promise<AuthActionResult> {
  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  // Validar campos obligatorios
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Todos los campos son obligatorios." };
  }

  // Validar que las nuevas contraseñas coincidan
  if (newPassword !== confirmPassword) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  // Validar requisitos de la nueva contraseña
  const passwordError = validatePasswordRule(newPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  // Validar que la nueva contraseña sea diferente a la actual
  if (currentPassword === newPassword) {
    return { error: "La nueva contraseña debe ser diferente a la actual." };
  }

  return changePassword(currentPassword, newPassword);
}

/**
 * Server Action: marca el onboarding de preferencias como completado
 * para el usuario CLIENTE autenticado actual.
 *
 * Establece `user_metadata.preferences_onboarding_complete = true`
 * para que el modal de bienvenida no vuelva a mostrarse automáticamente.
 */
export async function setPreferencesOnboardingCompleteAction(): Promise<ActionResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "No hay sesión activa." };
  }

  const result = await setPreferencesOnboardingComplete(user.id);

  if (!result.success) {
    return {
      success: false,
      message: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
    };
  }

  return { success: true };
}
