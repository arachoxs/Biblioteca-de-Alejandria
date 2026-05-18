"use server";

import { buscarNoticias } from "@/services/noticias/noticiaService";
import { sanitizeText, toSafePositiveInt } from "@/lib/validations/rules";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import type { BuscarNoticiasParams } from "@/services/noticias/noticiaService";

const TEXT_FILTER_PARAMS = ["q", "autor", "categoria", "idioma", "editorial", "estado"] as const;

function parseTextFilterParam(params: URLSearchParams, key: string, sanitize = true): string | undefined {
  const value = params.get(key)?.trim();
  if (!value) return undefined;
  return sanitize ? sanitizeText(value) : value;
}

function parseSearchFilters(searchParams: URLSearchParams): BuscarNoticiasParams {
  const result: Partial<BuscarNoticiasParams> = {};

  for (const key of TEXT_FILTER_PARAMS) {
    const value = parseTextFilterParam(searchParams, key);
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = key === "estado" ? (value as "nuevo" | "usado") : value;
    }
  }

  const page = toSafePositiveInt(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(toSafePositiveInt(Number(searchParams.get("pageSize") ?? 20), 20), 100);

  const ano_publicacion_str = searchParams.get("ano_publicacion")?.trim();
  const ano_publicacion = ano_publicacion_str ? toSafePositiveInt(Number(ano_publicacion_str), NaN) || undefined : undefined;

  const precioMin_str = searchParams.get("precioMin")?.trim();
  const precioMin = precioMin_str ? parseFloat(precioMin_str) : undefined;

  const precioMax_str = searchParams.get("precioMax")?.trim();
  const precioMax = precioMax_str ? parseFloat(precioMax_str) : undefined;

  return {
    page,
    pageSize,
    ano_publicacion,
    precioMin,
    precioMax,
    ...result,
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
