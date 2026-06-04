"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import type {
  ItemDevolucionElegible,
  MotivoDevolucion,
} from "@/lib/types/devolucion";

const MOTIVOS: { value: MotivoDevolucion; label: string }[] = [
  { value: "producto en mal estado", label: "Producto en mal estado" },
  { value: "no lleno las expectativas", label: "No llenó las expectativas" },
  {
    value: "el pedido llego a un tiempo superior al estipulado",
    label: "El pedido llegó con retraso",
  },
];

interface PasoMotivosProps {
  seleccionados: Set<string>;
  items: ItemDevolucionElegible[];
  motivos: Record<string, { motivo: MotivoDevolucion; descripcion_motivo: string }>;
  onUpdateMotivo: (
    id_copia: string,
    campo: "motivo" | "descripcion_motivo",
    valor: string,
  ) => void;
}

export default function PasoMotivos({
  seleccionados,
  items,
  motivos,
  onUpdateMotivo,
}: PasoMotivosProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-brand-secondary">
        Indica el motivo de la devolución para cada producto:
      </p>
      {Array.from(seleccionados).map((id_copia) => {
        const item = items.find((i) => i.id_copia === id_copia);
        return (
          <div
            key={id_copia}
            className="space-y-3 pb-4 border-b border-brand-accent/10 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 bg-brand-bg">
                {item?.imagen_portada ? (
                  <Image
                    src={item.imagen_portada}
                    alt={item.libro?.titulo ?? "Portada"}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-3 h-3 text-brand-accent/40" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-brand-text">
                {item?.libro?.titulo ?? "Libro sin título"}
              </p>
            </div>
            <div className="space-y-2">
              {MOTIVOS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    motivos[id_copia]?.motivo === m.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-brand-accent/15 hover:border-brand-accent/30"
                  }`}>
                  <input
                    type="radio"
                    name={`motivo-${id_copia}`}
                    value={m.value}
                    checked={motivos[id_copia]?.motivo === m.value}
                    onChange={() => onUpdateMotivo(id_copia, "motivo", m.value)}
                    className="w-4 h-4 border-brand-accent/30 text-brand-primary focus:ring-brand-primary/20"
                  />
                  <span className="text-sm text-brand-text">{m.label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs text-brand-secondary mb-1">
                Descripción adicional (opcional)
              </label>
              <textarea
                value={motivos[id_copia]?.descripcion_motivo ?? ""}
                onChange={(e) =>
                  onUpdateMotivo(id_copia, "descripcion_motivo", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 text-sm border border-brand-accent/20 rounded-lg resize-none focus:outline-none focus:border-brand-primary text-brand-text placeholder:text-brand-accent/40"
                placeholder="Describe brevemente el problema..."
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
