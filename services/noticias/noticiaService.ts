import { getAllNoticiasWithLibroCompleto, getNoticiaCompletaById } from "@/models/noticiaModel";
import type { NoticiaId, NoticiaFilters } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";

export interface BuscarNoticiasParams {
  page?: number;
  pageSize?: number;
  q?: string;
  autor?: string;
  categoria?: string;
  ano_publicacion?: number;
  idioma?: string;
  editorial?: string;
  precioMin?: number;
  precioMax?: number;
  estado?: "nuevo" | "usado";
}

export async function buscarNoticias(
  params: BuscarNoticiasParams
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const {
    page = 1,
    pageSize = 20,
    q,
    autor,
    categoria,
    ano_publicacion,
    idioma,
    editorial,
    precioMin,
    precioMax,
    estado,
  } = params;

  const filters: NoticiaFilters = {
    searchTerm: q,
    autor,
    categoria,
    ano_publicacion,
    idioma,
    editorial,
    precioMin,
    precioMax,
    estado,
  };

  try {
    const result = await getAllNoticiasWithLibroCompleto(page, pageSize, filters);
    return result;
  } catch (error) {
    console.error("[noticiaService] Error searching noticias:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

export async function getNoticiaDetalle(
  id: NoticiaId
): Promise<NoticiaWithLibroCompleto | null> {
  try {
    return await getNoticiaCompletaById(id);
  } catch (error) {
    console.error("[noticiaService] Error getting noticia detalle:", error);
    return null;
  }
}