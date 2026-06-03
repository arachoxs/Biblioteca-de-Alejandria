"use client";

import { MessageSquare, Clock, ChevronRight } from "lucide-react";
import type { HiloListItem } from "@/lib/types/hiloMensajeria";

interface HiloCardProps {
  hilo: HiloListItem;
  onClick: (hiloId: string) => void;
  showUsuario?: boolean;
}

function formatFechaRelativa(fecha: string): string {
  const now = new Date();
  const date = new Date(fecha);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function HiloCard({ hilo, onClick, showUsuario = false }: HiloCardProps) {
  const estadoClasses =
    hilo.estado === "abierto"
      ? "bg-brand-primary/10 text-brand-primary"
      : "bg-brand-accent/15 text-brand-accent";

  return (
    <button
      type="button"
      onClick={() => onClick(hilo.id)}
      className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer group ${
        hilo.tiene_nuevo_mensaje
          ? "border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10"
          : "border-brand-accent/15 bg-white hover:bg-brand-bg/50"
      }`}
    >
      {hilo.tiene_nuevo_mensaje && (
        <div className="w-2 h-2 mt-2 rounded-full bg-brand-primary shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3
            className={`text-sm font-medium truncate ${
              hilo.tiene_nuevo_mensaje ? "text-brand-text" : "text-brand-secondary"
            }`}
          >
            {hilo.titulo}
          </h3>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${estadoClasses}`}
          >
            {hilo.estado === "abierto" ? "Abierto" : "Cerrado"}
          </span>
        </div>

        <p className="text-xs text-brand-accent line-clamp-2 mb-2">
          {hilo.ultima_respuesta?.mensaje ?? hilo.mensaje}
        </p>

        <div className="flex items-center gap-3 text-[11px] text-brand-accent/70">
          {showUsuario && hilo.usuario && (
            <span>
              {hilo.usuario.nombres} {hilo.usuario.apellidos}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {hilo.total_respuestas}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatFechaRelativa(
              hilo.ultima_respuesta?.fecha_creacion ?? hilo.fecha_creacion
            )}
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 mt-1 text-brand-accent/40 group-hover:text-brand-primary transition-colors shrink-0" />
    </button>
  );
}
