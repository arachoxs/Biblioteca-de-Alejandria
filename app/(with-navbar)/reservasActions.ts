"use server";

import { getCurrentUser } from "@/models/authModel";
import { getErrorMessage } from "@/lib/services/errors";
import { createReservaForBook } from "@/services/reservas/reservaService";
import { revalidatePath } from "next/cache";
import { sanitizeText, isValidUUID } from "@/lib/validations/rules";
import type { ReservaActionResponse } from "@/lib/types/reserva";

export async function addToCartAction(
  id_libro: string,
): Promise<ReservaActionResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      errors: { form: "Debes iniciar sesión para reservar libros." },
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
      message: "Error inesperado al agregar al carrito.",
    };
  }
}
