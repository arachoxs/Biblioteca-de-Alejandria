"use server";

import { obtenerDevolucionPorToken } from "@/services/devolucion/devolucionService";
import type { DevolucionConItems } from "@/lib/types/devolucion";

export async function fetchDevolucionPorTokenAction(
  token: string
): Promise<DevolucionConItems | null> {
  try {
    return await obtenerDevolucionPorToken(token);
  } catch (error) {
    console.error("[devolucionesAction] Error fetching devolución por token:", error);
    return null;
  }
}
