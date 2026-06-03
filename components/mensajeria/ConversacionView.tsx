"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ArrowLeft, Lock, Unlock, User, ShieldCheck } from "lucide-react";
import type { HiloWithRespuestas } from "@/lib/types/hiloMensajeria";

interface ConversacionViewProps {
  hilo: HiloWithRespuestas;
  onBack: () => void;
  onEnviarRespuesta: (mensaje: string) => Promise<void>;
  onCerrarHilo?: () => Promise<void>;
  onReabrirHilo?: () => Promise<void>;
  esAdmin: boolean;
  enviando: boolean;
}

function formatFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversacionView({
  hilo,
  onBack,
  onEnviarRespuesta,
  onCerrarHilo,
  onReabrirHilo,
  esAdmin,
  enviando,
}: ConversacionViewProps) {
  const [mensaje, setMensaje] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hilo.respuestas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim() || enviando) return;

    await onEnviarRespuesta(mensaje.trim());
    setMensaje("");
  }

  const estaCerrado = hilo.estado === "cerrado";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-brand-accent/15 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-brand-bg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-brand-secondary" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-brand-text truncate">
            {hilo.titulo}
          </h2>
          <p className="text-xs text-brand-accent">
            {estaCerrado ? "Hilo cerrado" : "Hilo abierto"}
          </p>
        </div>

        {esAdmin && (
          <button
            type="button"
            onClick={estaCerrado ? onReabrirHilo : onCerrarHilo}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
          >
            {estaCerrado ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Reabrir
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Cerrar
              </>
            )}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-bg/30">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-brand-text">
                {hilo.usuario
                  ? `${hilo.usuario.nombres} ${hilo.usuario.apellidos}`
                  : "Usuario"}
              </span>
              <span className="text-[10px] text-brand-accent/60">
                {formatFecha(hilo.fecha_creacion)}
              </span>
            </div>
            <div className="bg-white rounded-xl rounded-tl-sm p-3 border border-brand-accent/10">
              <p className="text-sm text-brand-secondary whitespace-pre-wrap">
                {hilo.mensaje}
              </p>
            </div>
          </div>
        </div>

        {hilo.respuestas.map((respuesta) => (
          <div key={respuesta.id} className="flex gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                respuesta.es_admin
                  ? "bg-brand-secondary/10"
                  : "bg-brand-primary/10"
              }`}
            >
              {respuesta.es_admin ? (
                <ShieldCheck className="w-4 h-4 text-brand-secondary" />
              ) : (
                <User className="w-4 h-4 text-brand-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-brand-text">
                  {respuesta.autor_nombre}
                </span>
                {respuesta.es_admin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary font-medium">
                    Admin
                  </span>
                )}
                <span className="text-[10px] text-brand-accent/60">
                  {formatFecha(respuesta.fecha_creacion)}
                </span>
              </div>
              <div
                className={`rounded-xl p-3 border ${
                  respuesta.es_admin
                    ? "bg-brand-secondary/5 border-brand-secondary/10 rounded-tr-sm"
                    : "bg-white border-brand-accent/10 rounded-tl-sm"
                }`}
              >
                <p className="text-sm text-brand-secondary whitespace-pre-wrap">
                  {respuesta.mensaje}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-brand-accent/15 bg-white">
        {estaCerrado ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-brand-accent">
            <Lock className="w-4 h-4" />
            Este hilo está cerrado
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={enviando}
              className="flex-1 px-4 py-2.5 rounded-xl border border-brand-accent/20 bg-brand-bg/30 text-sm text-brand-text placeholder:text-brand-accent/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!mensaje.trim() || enviando}
              className="px-4 py-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
