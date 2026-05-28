import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-brand-accent/10 bg-brand-bg/50">
      <p className="text-xs text-brand-secondary font-medium">
        Página <span className="text-brand-primary">{currentPage}</span> de{" "}
        <span className="text-brand-primary">{totalPages}</span>
        {totalItems !== undefined && totalItems !== null && (
          <span className="hidden sm:inline">
            {" "}
            • <span className="text-brand-primary">{totalItems}</span> resultados
          </span>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3) {
                pageNum = currentPage - 2 + i;
              }
              if (pageNum > totalPages) {
                pageNum = totalPages - 4 + i;
              }
            }
            return pageNum;
          }).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                currentPage === page
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "bg-transparent text-brand-secondary hover:bg-brand-bg hover:text-brand-text"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
