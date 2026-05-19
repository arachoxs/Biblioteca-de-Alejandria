"use client";

import { useSearchParams } from "next/navigation";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import SearchFilters from "@/components/ui/SearchFilters";
import NewsGrid from "@/components/ui/NewsGrid";

interface SearchResultsClientProps {
  initialResults: Paginated<NoticiaWithLibroCompleto>;
}

interface CurrentFilters {
  q?: string;
  autor?: string;
  categoria?: string;
  ano_publicacion?: string;
  idioma?: string;
  editorial?: string;
  precioMin?: string;
  precioMax?: string;
  estado?: string;
}

const FILTER_KEYS = ["q", "autor", "categoria", "ano_publicacion", "idioma", "editorial", "precioMin", "precioMax", "estado"] as const;

function buildCurrentFilters(searchParams: ReturnType<typeof useSearchParams>): CurrentFilters {
  const filters: CurrentFilters = {};

  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) {
      filters[key] = value;
    }
  }

  return filters;
}

function useCurrentFilters() {
  const searchParams = useSearchParams();
  return buildCurrentFilters(searchParams);
}

export default function SearchResultsClient({ initialResults }: SearchResultsClientProps) {
  const currentFilters = useCurrentFilters();

  return (
    <div className="flex gap-8 flex-col lg:flex-row">
      <SearchFilters currentFilters={currentFilters} />
      <div className="flex-1">
        <NewsGrid initialNews={initialResults.data} totalPages={initialResults.totalPages} />
      </div>
    </div>
  );
}
