"use server";

import { buscarNoticias } from "@/services/noticias/noticiaService";
import { sanitizeText, toSafePositiveInt } from "@/lib/validations/rules";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import type { BuscarNoticiasParams } from "@/services/noticias/noticiaService";

function parseSearchFilters(searchParams: URLSearchParams): BuscarNoticiasParams {
  const page = toSafePositiveInt(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(toSafePositiveInt(Number(searchParams.get("pageSize") ?? 20), 20), 100);

  const q = searchParams.get("q")?.trim() || undefined;

  const autor = searchParams.get("autor")?.trim() || undefined;
  const categoria = searchParams.get("categoria")?.trim() || undefined;
  const idioma = searchParams.get("idioma")?.trim() || undefined;
  const editorial = searchParams.get("editorial")?.trim() || undefined;
  const estado = searchParams.get("estado")?.trim() || undefined;

  const ano_publicacion_str = searchParams.get("ano_publicacion")?.trim();
  const ano_publicacion = ano_publicacion_str ? toSafePositiveInt(Number(ano_publicacion_str), NaN) || undefined : undefined;

  const precioMin_str = searchParams.get("precioMin")?.trim();
  const precioMin = precioMin_str ? parseFloat(precioMin_str) : undefined;

  const precioMax_str = searchParams.get("precioMax")?.trim();
  const precioMax = precioMax_str ? parseFloat(precioMax_str) : undefined;

  return {
    page,
    pageSize,
    q,
    autor: autor ? sanitizeText(autor) : undefined,
    categoria: categoria ? sanitizeText(categoria) : undefined,
    idioma: idioma ? sanitizeText(idioma) : undefined,
    editorial: editorial ? sanitizeText(editorial) : undefined,
    estado: estado as "nuevo" | "usado" | undefined,
    ano_publicacion,
    precioMin,
    precioMax,
  };
}

export async function buscarNoticiasAction(
  searchParams: URLSearchParams
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const filters = parseSearchFilters(searchParams);

  try {
    return await buscarNoticias(filters);
  } catch (error) {
    console.error("[buscarAction] Error searching noticias:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: filters.pageSize ?? 20,
      totalPages: 0,
    };
  }
}
