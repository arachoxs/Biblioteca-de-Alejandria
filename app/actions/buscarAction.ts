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

function parseNumericParam(
  params: URLSearchParams,
  key: string,
  parser: (v: string) => number | undefined
): number | undefined {
  const value = params.get(key)?.trim();
  return value ? parser(value) : undefined;
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

  const ano_publicacion = parseNumericParam(searchParams, "ano_publicacion", (v) =>
    toSafePositiveInt(Number(v), NaN) || undefined
  );
  const precioMin = parseNumericParam(searchParams, "precioMin", parseFloat);
  const precioMax = parseNumericParam(searchParams, "precioMax", parseFloat);

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
