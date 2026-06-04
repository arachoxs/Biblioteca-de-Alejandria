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

function SummaryItem({
  item,
  motivo,
}: {
  item: ItemDevolucionElegible | undefined;
  motivo: { motivo: MotivoDevolucion; descripcion_motivo: string } | undefined;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-brand-accent/15 bg-brand-bg/50">
      <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 bg-brand-bg">
        {item?.imagen_portada ? (
          <Image src={item.imagen_portada} alt={item.libro?.titulo ?? "Portada"} fill className="object-cover" sizes="32px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-brand-accent/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text">
          {item?.libro?.titulo ?? "Libro sin título"}
        </p>
        <p className="text-xs text-brand-secondary mt-1">
          {MOTIVOS.find((mot) => mot.value === motivo?.motivo)?.label}
        </p>
        {motivo?.descripcion_motivo && (
          <p className="text-xs text-brand-secondary mt-1 italic">
            &ldquo;{motivo.descripcion_motivo}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

interface PasoConfirmacionProps {
  seleccionados: Set<string>;
  items: ItemDevolucionElegible[];
  motivos: Record<string, { motivo: MotivoDevolucion; descripcion_motivo: string }>;
}

export default function PasoConfirmacion({
  seleccionados,
  items,
  motivos,
}: PasoConfirmacionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-secondary">
        Confirma los productos que deseas devolver:
      </p>
      <div className="space-y-3">
        {Array.from(seleccionados).map((id_copia) => (
          <SummaryItem
            key={id_copia}
            item={items.find((i) => i.id_copia === id_copia)}
            motivo={motivos[id_copia]}
          />
        ))}
      </div>
      <div className="p-3 rounded-lg bg-brand-primary/5 border border-brand-primary/10">
        <p className="text-xs text-brand-secondary">
          Al confirmar, se registrará tu solicitud de devolución y
          recibirás un correo con el código QR y el enlace al detalle de
          tu devolución.
        </p>
      </div>
    </div>
  );
}
