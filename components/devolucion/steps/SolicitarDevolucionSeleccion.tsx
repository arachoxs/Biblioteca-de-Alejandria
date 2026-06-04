"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import type { ItemDevolucionElegible } from "@/lib/types/devolucion";

interface PasoSeleccionProps {
  items: ItemDevolucionElegible[];
  seleccionados: Set<string>;
  onToggle: (id_copia: string) => void;
}

export default function PasoSeleccion({
  items,
  seleccionados,
  onToggle,
}: PasoSeleccionProps) {
  const elegibles = items.filter((i) => !i.ya_devuelto);
  const devueltos = items.filter((i) => i.ya_devuelto);

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-secondary">
        Selecciona los productos que deseas devolver:
      </p>
      {elegibles.length === 0 ? (
        <p className="text-sm text-brand-secondary text-center py-8">
          No hay productos elegibles para devolución.
        </p>
      ) : (
        <div className="space-y-2">
          {elegibles.map((item) => (
            <label
              key={item.id_copia}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                seleccionados.has(item.id_copia)
                  ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                  : "border-brand-accent/15 hover:border-brand-accent/30 hover:bg-brand-bg/50"
              }`}>
              <input
                type="checkbox"
                checked={seleccionados.has(item.id_copia)}
                onChange={() => onToggle(item.id_copia)}
                className="w-4 h-4 rounded border-brand-accent/30 text-brand-primary focus:ring-brand-primary/20"
              />
              <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-brand-bg">
                {item.imagen_portada ? (
                  <Image
                    src={item.imagen_portada}
                    alt={item.libro?.titulo ?? "Portada"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-brand-accent/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text truncate">
                  {item.libro?.titulo ?? "Libro sin título"}
                </p>
                {item.libro && (
                  <p className="text-xs text-brand-secondary">
                    {item.libro.editorial}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
      {devueltos.length > 0 && (
        <div className="pt-2 border-t border-brand-accent/10">
          <p className="text-xs text-brand-secondary mb-2">
            Productos con devolución previa:
          </p>
          {devueltos.map((item) => (
            <div
              key={item.id_copia}
              className="flex items-center gap-2.5 py-1.5 opacity-50">
              <div className="w-4 h-4 rounded border border-brand-accent/20 bg-brand-bg" />
              <p className="text-sm text-brand-secondary line-through">
                {item.libro?.titulo ?? "Libro sin título"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
