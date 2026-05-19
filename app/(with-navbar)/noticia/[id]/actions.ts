"use server";

import type { NoticiaId } from "@/lib/types/noticia";
import { getNoticiaDetalle } from "@/services/noticias/noticiaService";

export async function getNoticiaDetail(id: NoticiaId) {
  return getNoticiaDetalle(id);
}