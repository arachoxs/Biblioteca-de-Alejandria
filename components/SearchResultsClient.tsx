"use client";

import { useSearchParams } from "next/navigation";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import SearchFilters from "@/components/ui/SearchFilters";
import NewsGrid from "@/components/ui/NewsGrid";

interface SearchResultsClientProps {
  initialResults: Paginated<NoticiaWithLibroCompleto>;
}

export default function SearchResultsClient({ initialResults }: SearchResultsClientProps) {
  const searchParams = useSearchParams();

  const currentFilters = {
    q: searchParams.get("q") || undefined,
    autor: searchParams.get("autor") || undefined,
    categoria: searchParams.get("categoria") || undefined,
    ano_publicacion: searchParams.get("ano_publicacion") || undefined,
    idioma: searchParams.get("idioma") || undefined,
    editorial: searchParams.get("editorial") || undefined,
    precioMin: searchParams.get("precioMin") || undefined,
    precioMax: searchParams.get("precioMax") || undefined,
    estado: searchParams.get("estado") || undefined,
  };

  return (
    <div className="flex gap-8 flex-col lg:flex-row">
      <SearchFilters currentFilters={currentFilters} />
      <div className="flex-1">
        <NewsGrid initialNews={initialResults.data} totalPages={initialResults.totalPages} />
      </div>
    </div>
  );
}