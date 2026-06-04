"use client";

import { useState, useEffect } from "react";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { fetchHistorialDevolucionesAction } from "@/app/(with-navbar)/historial-compras/actions";
import type {
  DevolucionConItems,
  EstadoDevolucion,
} from "@/lib/types/devolucion";

const ESTADO_CONFIG: Record<
  EstadoDevolucion,
  { label: string; color: string; bg: string; icon: typeof Clock }
> = {
  revision: {
    label: "En revisión",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    icon: Clock,
  },
  cancelado: {
    label: "Cancelada",
    color: "text-brand-secondary",
    bg: "bg-gray-50",
    icon: XCircle,
  },
  devuelto: {
    label: "Devuelta",
    color: "text-green-700",
    bg: "bg-green-50",
    icon: CheckCircle2,
  },
};

function formatFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}

function DevolucionCard({ devolucion }: { devolucion: DevolucionConItems }) {
  const [abierta, setAbierta] = useState(false);
  const config = ESTADO_CONFIG[devolucion.estado];
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setAbierta((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-brand-bg/50 cursor-pointer transition-colors">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text">
              Devolución #{devolucion.id}
            </p>
            <p className="text-xs text-brand-secondary">
              {formatFecha(devolucion.fecha)} · {devolucion.items.length}{" "}
              {devolucion.items.length === 1 ? "producto" : "productos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-brand-accent transition-transform duration-200 ${
              abierta ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {abierta && (
        <div className="border-t border-brand-accent/10 px-5 py-3 space-y-2">
          {devolucion.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5">
              <p className="text-sm text-brand-text truncate max-w-[70%]">
                {item.libro?.titulo ?? "Libro"}
              </p>
              <p className="text-xs text-brand-secondary">
                {item.motivo === "producto en mal estado"
                  ? "Mal estado"
                  : item.motivo === "no lleno las expectativas"
                    ? "Sin expectativas"
                    : "Retraso"}
              </p>
            </div>
          ))}
          <a
            href={`/devoluciones/${devolucion.token}`}
            className="inline-block mt-2 text-xs font-medium text-brand-primary hover:underline cursor-pointer">
            Ver detalle completo →
          </a>
        </div>
      )}
    </div>
  );
}

export default function HistorialDevoluciones() {
  const [devoluciones, setDevoluciones] = useState<DevolucionConItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchHistorialDevolucionesAction();
        if (!cancelled) setDevoluciones(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-600 mb-2">
          No se pudieron cargar las devoluciones.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-brand-primary hover:underline cursor-pointer">
          Reintentar
        </button>
      </div>
    );
  }

  if (devoluciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center mb-3">
          <RotateCcw className="w-6 h-6 text-brand-accent/40" />
        </div>
        <p className="text-sm text-brand-secondary">
          No tienes devoluciones registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devoluciones.map((dev) => (
        <DevolucionCard key={dev.id} devolucion={dev} />
      ))}
    </div>
  );
}
