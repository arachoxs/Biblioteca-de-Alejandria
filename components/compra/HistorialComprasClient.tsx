"use client";

import { useState, useCallback } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { fetchHistorialComprasAction } from "@/app/(with-navbar)/historial-compras/actions";
import CompraCard from "./CompraCard";
import type {
  CompraConItems,
  CompraHistorialResponse,
} from "@/lib/types/compra";

interface HistorialComprasClientProps {
  initialData: CompraHistorialResponse;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-brand-accent/40" />
      </div>
      <p className="text-brand-secondary text-sm">
        No tienes compras registradas.
      </p>
    </div>
  );
}

function ErrorRetry({
  message,
  onRetry,
  disabled,
}: {
  message: string;
  onRetry: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <p className="text-sm text-red-600">{message}</p>
      <button
        onClick={onRetry}
        disabled={disabled}
        className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
      >
        Reintentar
      </button>
    </div>
  );
}

function LoadMoreButton({
  onClick,
  isLoading,
}: {
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex justify-center pt-2">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando...</span>
          </>
        ) : (
          <span>Cargar más</span>
        )}
      </button>
    </div>
  );
}

export default function HistorialComprasClient({
  initialData,
}: HistorialComprasClientProps) {
  const [items, setItems] = useState<CompraConItems[]>(initialData.data);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [hasMore, setHasMore] = useState(
    initialData.page < initialData.totalPages
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setError(null);
    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result: CompraHistorialResponse =
        await fetchHistorialComprasAction({
          page: nextPage,
          pageSize: initialData.pageSize,
        });
      setItems((prev) => [...prev, ...result.data]);
      setCurrentPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch (err) {
      console.error("[HistorialComprasClient] Error loading more:", err);
      setError("No se pudieron cargar más compras. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, hasMore, initialData.pageSize]);

  if (items.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((compra) => (
          <CompraCard key={compra.id} compra={compra} />
        ))}
      </div>

      {error && (
        <ErrorRetry
          message={error}
          onRetry={handleLoadMore}
          disabled={isLoading}
        />
      )}

      {hasMore && !error && (
        <LoadMoreButton onClick={handleLoadMore} isLoading={isLoading} />
      )}
    </div>
  );
}
