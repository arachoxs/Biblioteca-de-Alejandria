"use client";

import dynamic from "next/dynamic";
import BackLink from "@/components/ui/BackLink";
import type { ModeloRADimensiones, ModeloRATexturasLibro } from "@/lib/types/modelo_ra";

const BookARViewer = dynamic(() => import("@/components/ra/BookARViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface ARPageContentProps {
  titulo: string;
  sinopsis: string;
  dimensiones: ModeloRADimensiones;
  texturas: ModeloRATexturasLibro;
}

export default function ARPageContent({
  titulo,
  sinopsis,
  dimensiones,
  texturas,
}: ARPageContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-brand-accent/10 z-10">
        <BackLink href="/" label="Volver al catálogo" />
        <h1 className="text-lg font-bold text-brand-primary font-display mt-1">
          {titulo} — Visor AR
        </h1>
      </div>
      <div className="flex-1 relative min-h-0">
        <BookARViewer
          dimensiones={dimensiones}
          texturas={texturas}
          sinopsis={sinopsis}
          titulo={titulo}
        />
      </div>
    </div>
  );
}
