import Image from "next/image";
import { BookOpen } from "lucide-react";
import { formatPrecio } from "@/lib/utils/format";
import type { CompraItem } from "@/lib/types/compra";

interface CompraItemCardProps {
  item: CompraItem;
}

export default function CompraItemCard({ item }: CompraItemCardProps) {
  const { libro, imagen_portada, cantidad, precio_unitario } = item;

  return (
    <div className="flex gap-4 py-4 px-5 border-b border-brand-accent/10 last:border-b-0">
      {/* Portada */}
      <div className="relative w-16 sm:w-20 shrink-0 aspect-[3/4] bg-brand-bg rounded-md overflow-hidden">
        {imagen_portada ? (
          <Image
            src={imagen_portada}
            alt={libro?.titulo || "Portada del libro"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, 80px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-accent/10">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-brand-accent/40" />
          </div>
        )}
      </div>

      {/* Info + Botones */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-brand-text line-clamp-2">
            {libro?.titulo || "Título no disponible"}
          </h3>
          {libro && (
            <p className="text-xs text-brand-secondary">{libro.editorial}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-brand-primary">
              {libro ? formatPrecio(precio_unitario) : "—"}
            </p>
            {cantidad > 1 && (
              <span className="text-xs text-brand-secondary">
                {cantidad} unidades
              </span>
            )}
          </div>
        </div>

        {/* Botón deshabilitado */}
        <div className="mt-2">
          <button
            disabled
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-secondary/40 cursor-not-allowed"
            title="Próximamente"
          >
            Devolución
          </button>
        </div>
      </div>
    </div>
  );
}
