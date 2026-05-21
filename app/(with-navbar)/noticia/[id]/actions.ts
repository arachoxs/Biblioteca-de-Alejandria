"use server";

import type { NoticiaId } from "@/lib/types/noticia";
import { getNoticiaDetalle } from "@/services/noticias/noticiaService";
import { createReservaForBook } from "@/services/reservas/reservaService";
import type { ReservaActionResponse } from "@/lib/types/reserva";

export async function getNoticiaDetail(id: NoticiaId) {
  return getNoticiaDetalle(id);
}

export async function addToCart(
  id_libro: string,
  cantidad: number,
): Promise<ReservaActionResponse> {
  return createReservaForBook(id_libro, cantidad);
}