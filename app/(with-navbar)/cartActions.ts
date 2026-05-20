"use server";

import { getCurrentUser } from "@/models/authModel";
import { getErrorMessage } from "@/lib/services/errors";
import {
  getReservasSummary,
  cancelReserva,
} from "@/services/reservas/reservaService";
import { revalidatePath } from "next/cache";
import { sanitizeText, isValidUUID } from "@/lib/validations/rules";
import type { ReservaActionResponse, ReservasAgrupadasResponse } from "@/lib/types/reserva";

export async function getCartAction(): Promise<ReservasAgrupadasResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "Debes iniciar sesión para ver tu carrito." },
      message: "No hay sesión activa.",
      data: [],
    };
  }

  return getReservasSummary();
}

export async function cancelCartItemAction(
  id_reserva: string,
): Promise<ReservaActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "Debes iniciar sesión." },
      message: "No hay sesión activa.",
    };
  }

  const sanitized = sanitizeText(id_reserva);
  if (!sanitized || !isValidUUID(sanitized)) {
    return {
      success: false,
      errors: { id: "El identificador de la reserva no es válido." },
      message: "No se pudo procesar la solicitud.",
    };
  }

  try {
    const result = await cancelReserva(sanitized);
    if (result.success) {
      revalidatePath("/");
    }
    return result;
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Error inesperado al cancelar la reserva.",
    };
  }
}
