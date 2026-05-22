"use server";

import type { NoticiaId } from "@/lib/types/noticia";
import { getNoticiaDetalle } from "@/services/noticias/noticiaService";
import { createReservaForBook } from "@/services/reservas/reservaService";
import { sanitizeText, isValidUUID } from "@/lib/validations/rules";
import type { ReservaActionResponse } from "@/lib/types/reserva";

export async function getNoticiaDetail(id: NoticiaId) {
  return getNoticiaDetalle(id);
}

export async function addToCart(
  id_libro: string,
  cantidad: number,
): Promise<ReservaActionResponse> {
  const sanitized = sanitizeText(id_libro);
  if (!sanitized || !isValidUUID(sanitized)) {
    return {
      success: false,
      errors: { id_libro: "El identificador del libro no es válido." },
      message: "No se pudo procesar la solicitud.",
    };
  }
  return createReservaForBook(sanitized, cantidad);
}