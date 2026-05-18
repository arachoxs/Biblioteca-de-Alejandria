"use server";

import { buscarNoticias } from "@/services/noticias/noticiaService";
import { sanitizeText, toSafePositiveInt } from "@/lib/validations/rules";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";

export async function buscarNoticiasAction(
  searchParams: URLSearchParams
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const page = toSafePositiveInt(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(toSafePositiveInt(Number(searchParams.get("pageSize") ?? 20), 20), 100);

  const q = searchParams.get("q")?.trim() ?? undefined;

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

  const cleanAutor = autor ? sanitizeText(autor) : undefined;
  const cleanCategoria = categoria ? sanitizeText(categoria) : undefined;
  const cleanIdioma = idioma ? sanitizeText(idioma) : undefined;
  const cleanEditorial = editorial ? sanitizeText(editorial) : undefined;

  try {
    const result = await buscarNoticias({
      page,
      pageSize,
      q,
      autor: cleanAutor,
      categoria: cleanCategoria,
      idioma: cleanIdioma,
      editorial: cleanEditorial,
      ano_publicacion,
      precioMin,
      precioMax,
      estado: estado as "nuevo" | "usado" | undefined,
    });

    return result;
  } catch (error) {
    console.error("[buscarAction] Error searching noticias:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}