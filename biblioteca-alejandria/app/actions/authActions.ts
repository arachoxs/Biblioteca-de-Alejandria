"use server";

import { globalSignOutModel } from "@/models/authModel";

/**
 * Server Action: cierra la sesión del usuario en todos los dispositivos.
 * Internamente delega a `globalSignOutModel()` que ejecuta el sign-out
 * con scope "global" y redirige al inicio.
 */
export async function globalSignOutAction(): Promise<void> {
  await globalSignOutModel();
}
