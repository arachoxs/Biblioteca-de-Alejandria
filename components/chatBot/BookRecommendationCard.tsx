"use client";

import { useRouter } from "next/navigation";
import { useChatModalClose } from "./ChatModalContext";

interface BookRecommendationCardProps {
  titulo: string;
  autor: string;
  categoria: string;
  precio: number;
  copias_disponibles: number;
  noticia_id?: string;
}

export default function BookRecommendationCard({
  titulo,
  autor,
  categoria,
  precio,
  copias_disponibles,
  noticia_id,
}: BookRecommendationCardProps) {
  const router = useRouter();
  const { closeChat } = useChatModalClose();

  const handleVerDetalle = () => {
    closeChat();
    router.push(`/noticia/${noticia_id}`);
  };

  return (
    <div className="book-card group relative bg-white/80 border border-brand-accent/20 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:border-brand-accent/40">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-primary to-brand-accent/60 rounded-l-lg" />

      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-[15px] font-semibold text-brand-primary leading-snug tracking-tight line-clamp-2">
              {titulo}
            </h4>
            <p className="text-[11px] text-brand-secondary/80 mt-0.5 font-medium tracking-wide uppercase">
              {autor}
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-brand-primary bg-brand-bg/80 px-2 py-1 rounded-md tabular-nums">
            ${precio.toLocaleString("es-CO")}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[10px] px-1.5 py-0.5 bg-brand-bg border border-brand-accent/15 rounded text-brand-secondary/70 font-medium tracking-wider uppercase">
            {categoria}
          </span>
          <span className="text-[10px] text-green-700 font-medium">
            {copias_disponibles}{" "}
            {copias_disponibles === 1 ? "copia" : "copias"}
          </span>
        </div>

        {noticia_id && (
          <button
            onClick={handleVerDetalle}
            className="mt-2.5 w-full text-left text-[11px] font-semibold text-brand-primary/80 hover:text-brand-primary transition-colors duration-200 flex items-center gap-1.5 group/btn cursor-pointer">
            <span className="underline decoration-brand-accent/40 underline-offset-2 group-hover/btn:decoration-brand-primary/60 transition-all duration-200">
              Ver detalle
            </span>
            <svg
              className="w-3 h-3 transition-transform duration-200 group-hover/btn:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
