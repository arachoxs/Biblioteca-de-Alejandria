"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import NewsCardClient from "./NewsCardClient";

interface NewsGridProps {
  initialNews?: NoticiaWithLibroCompleto[];
  totalPages?: number;
  isAdminView?: boolean;
  isAuthenticated?: boolean;
}

export default function NewsGrid({ initialNews = [], totalPages = 1, isAdminView = false, isAuthenticated = false }: NewsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [news, setNews] = useState<NoticiaWithLibroCompleto[]>(initialNews);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setNews(initialNews);
  }, [initialNews]);

  const currentPage = Number(searchParams.get("page")) || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }
    router.push(`?${params.toString()}`);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newNews = [...news];
    const draggedItem = newNews[draggedIndex];
    newNews.splice(draggedIndex, 1);
    newNews.splice(index, 0, draggedItem);
    setNews(newNews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (news.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-accent/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-brand-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <p className="text-brand-secondary text-center">No se encontraron libros con esos criterios de búsqueda</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {news.map((noticia, index) => (
          <div
            key={noticia.id}
            draggable={isAdminView}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative
              ${draggedIndex === index ? "opacity-50 scale-95" : ""}
              ${isAdminView ? "cursor-grab active:cursor-grabbing" : ""}
            `}
          >
            {isAdminView && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                <div className="w-6 h-6 rounded bg-brand-bg border border-brand-accent/30 flex items-center justify-center">
                  <GripVertical className="w-3.5 h-3.5 text-brand-secondary" />
                </div>
              </div>
            )}

            <NewsCardClient noticia={noticia} delay={index * 75} isAdminView={isAdminView} isAuthenticated={isAuthenticated} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-brand-accent/10">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-brand-secondary hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-brand-secondary">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-brand-secondary hover:text-brand-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}