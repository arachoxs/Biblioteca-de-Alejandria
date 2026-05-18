"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";

interface NewsCardClientProps {
  noticia: NoticiaWithLibroCompleto;
  delay?: number;
  isAdminView?: boolean;
}

export default function NewsCardClient({ noticia, delay = 0, isAdminView = false }: NewsCardClientProps) {
  const [isVisible, setIsVisible] = useState(noticia.es_visible);

  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(noticia.precio);

  const formattedDate = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(new Date(noticia.fecha_publicacion));

  return (
    <div
      className={`
        group relative flex flex-col bg-white border border-brand-accent/15 rounded-xl 
        overflow-hidden shadow-sm hover:shadow-lg hover:shadow-brand-text/8 
        transition-all duration-300 hover:-translate-y-0.5
        animate-in fade-in slide-in-from-bottom-4 fill-mode-both cursor-pointer
        ${!isVisible && isAdminView ? "opacity-60 border-dashed" : ""}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Link href="#" className="absolute inset-0 z-0" />

      {isAdminView && (
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsVisible(!isVisible);
            }}
            className={`
              w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer
              ${isVisible 
                ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" 
                : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100"
              }
            `}
            title={isVisible ? "Ocultar noticia" : "Mostrar noticia"}
          >
            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative aspect-[3/4] w-full bg-brand-bg overflow-hidden">
        {noticia.imagenes && noticia.imagenes.length > 0 ? (
          <Image
            src={noticia.imagenes[0]}
            alt={noticia.libro_titulo || "Libro"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-accent/10">
            <svg
              className="w-12 h-12 text-brand-accent/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-primary font-display">
            {formattedPrice}
          </span>
          <span className="text-[10px] text-brand-secondary/60">
            {formattedDate}
          </span>
        </div>

        <h3 className="font-display text-sm font-medium text-brand-text tracking-tight line-clamp-2 group-hover:text-brand-primary transition-colors">
          {noticia.libro_titulo || "Título no disponible"}
        </h3>
        {noticia.autor_nombre && (
          <p className="text-xs text-brand-secondary/70 truncate">
            {noticia.autor_nombre}
          </p>
        )}

        <div className="mt-auto pt-2">
          <span className="text-[10px] uppercase tracking-widest text-brand-accent font-medium">
            {isAdminView ? "Arrastra para reordenar" : "Ver detalles"}
          </span>
        </div>
      </div>
    </div>
  );
}