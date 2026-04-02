"use server";

import { globalSignOutModel } from "@/models/authModel";
import { changePassword } from "@/services/auth/authService";
import { validatePasswordRule } from "@/lib/validations/rules";
import type { AuthActionResult } from "@/lib/types/auth";

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
