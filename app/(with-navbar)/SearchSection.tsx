import { Suspense } from "react";
import SearchResultsClient from "@/components/SearchResultsClient";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";

interface SearchSectionProps {
  results: Paginated<NoticiaWithLibroCompleto>;
}

export default function SearchSection({ results }: SearchSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-8 pb-16">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-brand-accent/20" />
        <h2 className="font-display text-xl font-semibold text-brand-text tracking-tight">
          Resultados de búsqueda
        </h2>
        <div className="h-px flex-1 bg-brand-accent/20" />
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
          </div>
        }
      >
        <SearchResultsClient initialResults={results} />
      </Suspense>
    </section>
  );
}
