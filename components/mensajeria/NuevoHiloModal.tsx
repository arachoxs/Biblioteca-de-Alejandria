"use client";

import { useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";

interface NuevoHiloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (titulo: string, mensaje: string) => Promise<void>;
  enviando: boolean;
}

export default function NuevoHiloModal({
  isOpen,
  onClose,
  onSubmit,
  enviando,
}: NuevoHiloModalProps) {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !mensaje.trim() || enviando) return;

    await onSubmit(titulo.trim(), mensaje.trim());
    setTitulo("");
    setMensaje("");
  }

  function handleClose() {
    setTitulo("");
    setMensaje("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-text/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-accent/15 bg-brand-bg/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-text">
                Nuevo hilo
              </h2>
              <p className="text-xs text-brand-accent">
                Crea una consulta para nuestro equipo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-brand-accent/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-brand-accent" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="titulo"
              className="block text-xs font-medium text-brand-secondary mb-1.5"
            >
              Título
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Describe brevemente tu consulta"
              disabled={enviando}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-accent/20 bg-white text-sm text-brand-text placeholder:text-brand-accent/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="mensaje"
              className="block text-xs font-medium text-brand-secondary mb-1.5"
            >
              Mensaje
            </label>
            <textarea
              id="mensaje"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Explica en detalle tu consulta o problema..."
              disabled={enviando}
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-accent/20 bg-white text-sm text-brand-text placeholder:text-brand-accent/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all resize-none disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={enviando}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-accent hover:text-brand-text border border-brand-accent/20 hover:border-brand-accent/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!titulo.trim() || !mensaje.trim() || enviando}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {enviando ? "Creando..." : "Crear hilo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
