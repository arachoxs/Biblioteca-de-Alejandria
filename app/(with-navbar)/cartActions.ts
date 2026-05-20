"use server";

import { getCurrentUser } from "@/models/authModel";
import { getErrorMessage } from "@/lib/services/errors";
import {
  getReservasSummary,
  createReservaForBook,
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

export async function addCartBookAction(
  id_libro: string,
): Promise<ReservaActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "Debes iniciar sesión." },
      message: "No hay sesión activa.",
    };
  }

  const sanitized = sanitizeText(id_libro);
  if (!sanitized || !isValidUUID(sanitized)) {
    return {
      success: false,
      errors: { id_libro: "El identificador del libro no es válido." },
      message: "No se pudo procesar la solicitud.",
    };
  }

  try {
    const result = await createReservaForBook(sanitized, 1);
    if (result.success) {
      revalidatePath("/");
    }
    return result;
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Error inesperado al agregar una copia.",
    };
  }
}

export async function cancelBookReservasAction(
  reservaIds: string[],
): Promise<ReservaActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "Debes iniciar sesión." },
      message: "No hay sesión activa.",
    };
  }

  if (reservaIds.length === 0) {
    return { success: true, message: "No hay reservas que cancelar." };
  }

  const allValid = reservaIds.every((id) => {
    const cleaned = sanitizeText(id);
    return cleaned && isValidUUID(cleaned);
  });
  if (!allValid) {
    return {
      success: false,
      errors: { id: "Uno de los identificadores no es válido." },
      message: "No se pudo procesar la solicitud.",
    };
  }

  try {
    const results = await Promise.all(
      reservaIds.map((id) => cancelReserva(sanitizeText(id))),
    );
    const cancelledCount = results.filter((r) => r.success).length;

    if (cancelledCount === 0) {
      return {
        success: false,
        errors: { form: "No se pudo cancelar ninguna reserva." },
        message: "No se pudo cancelar ninguna reserva.",
      };
    }

    revalidatePath("/");

    if (cancelledCount < reservaIds.length) {
      return {
        success: false,
        message: `${cancelledCount} de ${reservaIds.length} reservas canceladas.`,
        errors: {
          form: `${cancelledCount} de ${reservaIds.length} reservas canceladas. Algunas no pudieron cancelarse.`,
        },
      };
    }

    return {
      success: true,
      message: `${cancelledCount} reserva${cancelledCount === 1 ? "" : "s"} cancelada${cancelledCount === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "Error al cancelar las reservas.",
    };
  }
}
