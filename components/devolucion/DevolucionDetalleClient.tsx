"use client";

import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { DevolucionConItems, EstadoDevolucion } from "@/lib/types/devolucion";

interface DevolucionDetalleClientProps {
  devolucion: DevolucionConItems;
}

const ESTADO_CONFIG: Record<
  EstadoDevolucion,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  revision: {
    label: "En revisión",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  cancelado: {
    label: "Cancelada",
    color: "text-brand-secondary",
    bg: "bg-gray-50 border-gray-200",
    icon: XCircle,
  },
  devuelto: {
    label: "Devuelta",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle2,
  },
};

const MOTIVO_LABELS: Record<string, string> = {
  "producto en mal estado": "Producto en mal estado",
  "no lleno las expectativas": "No llenó las expectativas",
  "el pedido llego a un tiempo superior al estipulado":
    "El pedido llegó con retraso",
};

function formatFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

export default function DevolucionDetalleClient({
  devolucion,
}: DevolucionDetalleClientProps) {
  const config = ESTADO_CONFIG[devolucion.estado];
  const Icon = config.icon;

  return (
    <div
      className="space-y-6"
      style={{ animation: "fadeUp 0.5s ease-out both" }}>
      <Link
        href="/historial-compras"
        className="inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:text-brand-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al historial
      </Link>

      <div
        className="pb-4 border-b border-brand-accent/10"
        style={{ animation: "fadeUp 0.5s ease-out 0.1s both" }}>
        <h1 className="text-xl font-display font-semibold text-brand-text">
          Detalle de Devolución
        </h1>
        <p className="text-sm text-brand-secondary mt-0.5">
          {formatFecha(devolucion.fecha)}
        </p>
      </div>

      <section
        className={`rounded-xl border p-5 ${config.bg}`}
        style={{ animation: "fadeUp 0.5s ease-out 0.2s both" }}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <div>
            <p className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </p>
            <p className="text-xs text-brand-secondary mt-0.5">
              Solicitud #{devolucion.id}
            </p>
          </div>
        </div>
      </section>

      <section
        className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden"
        style={{ animation: "fadeUp 0.5s ease-out 0.3s both" }}>
        <div className="px-5 py-3 border-b border-brand-accent/10">
          <h2 className="text-sm font-semibold text-brand-text">
            Productos devueltos ({devolucion.items.length})
          </h2>
        </div>
        <div>
          {devolucion.items.map((item, index) => (
            <div
              key={item.id}
              className={`flex gap-4 px-5 py-4 ${
                index < devolucion.items.length - 1
                  ? "border-b border-brand-accent/10"
                  : ""
              }`}>
              <div className="relative w-14 h-20 rounded-md overflow-hidden shrink-0 bg-brand-bg">
                {item.imagen_portada ? (
                  <Image
                    src={item.imagen_portada}
                    alt={item.libro?.titulo ?? "Portada"}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-accent/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text">
                  {item.libro?.titulo ?? `Copia ${item.id_copia.slice(0, 8)}`}
                </p>
                {item.libro && (
                  <p className="text-xs text-brand-secondary">
                    {item.libro.editorial}
                  </p>
                )}
                <p className="text-xs text-brand-secondary mt-1">
                  {MOTIVO_LABELS[item.motivo] ?? item.motivo}
                </p>
                {item.descripcion_motivo && (
                  <p className="text-xs text-brand-secondary mt-1 italic">
                    &ldquo;{item.descripcion_motivo}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
