"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Eye, EyeOff, Calendar, Loader2 } from "lucide-react";
import { actualizarNoticiaAction } from "./actions";
import type { NoticiaAdminItem } from "@/lib/types/noticia";

// ─── Visibility Toggle ─────────────────────────────────────────────

interface VisibilityToggleProps {
  esVisible: boolean;
  onChange: (visible: boolean) => void;
}

function VisibilityToggle({ esVisible, onChange }: VisibilityToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-brand-text">
        Visibilidad
      </label>
      <button
         type="button"
         onClick={() => onChange(!esVisible)}
         className={`flex items-center gap-3 w-full p-4 rounded-lg border transition-all cursor-pointer ${
           esVisible
             ? "border-brand-primary/30 bg-brand-primary/5"
             : "border-brand-accent/20 bg-brand-bg"
         }`}
      >
        {esVisible ? (
          <Eye className="w-5 h-5 text-brand-primary" />
        ) : (
          <EyeOff className="w-5 h-5 text-brand-secondary/60" />
        )}
        <div className="text-left">
          <p className={`font-medium ${esVisible ? "text-brand-primary" : "text-brand-secondary"}`}>
            {esVisible ? "Visible" : "Oculta"}
          </p>
          <p className="text-xs text-brand-secondary/70">
            {esVisible
              ? "La noticia es visible para los usuarios"
              : "La noticia está oculta para los usuarios"}
          </p>
        </div>
      </button>
    </div>
  );
}

// ─── Form Hook ─────────────────────────────────────────────────────

function useNoticiaEditForm(noticia: NoticiaAdminItem | null, onSuccess: () => void) {
  const [esVisible, setEsVisible] = useState(true);
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noticia) {
      setEsVisible(noticia.es_visible);
      setFechaExpiracion(
        noticia.fecha_expiracion
          ? new Date(noticia.fecha_expiracion).toISOString().split("T")[0]
          : ""
      );
      setError(null);
    }
  }, [noticia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticia) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("es_visible", String(esVisible));
      formData.append("fecha_expiracion", fechaExpiracion);

      const result = await actualizarNoticiaAction(noticia.id, formData);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || "Error actualizando noticia");
      }
    } catch {
      setError("Error inesperado al actualizar la noticia");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { esVisible, setEsVisible, fechaExpiracion, setFechaExpiracion, isSubmitting, error, handleSubmit };
}

// ─── Sub Components ────────────────────────────────────────────────

function NoticiaInfoCard({ titulo, autor }: { titulo: string | null; autor?: string | null }) {
  return (
    <div className="bg-brand-bg rounded-lg p-4">
      <p className="text-sm text-brand-secondary">Libro</p>
      <p className="font-semibold text-brand-text">
        {titulo || "Sin título"}
      </p>
      {autor && (
        <p className="text-sm text-brand-secondary">{autor}</p>
      )}
    </div>
  );
}

function ExpirationDatePicker({ value, onChange, min }: { value: string; onChange: (v: string) => void; min: string }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="fecha_expiracion"
        className="text-sm font-medium text-brand-text flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Fecha de expiración
      </label>
      <input
        id="fecha_expiracion"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        required
        className="w-full px-4 py-2.5 text-sm bg-brand-bg/50 border border-brand-accent/20 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all text-brand-text"
      />
      <p className="text-xs text-brand-secondary/70">
        La noticia será visible hasta esta fecha
      </p>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────

interface NoticiaEditModalProps {
  isOpen: boolean;
  noticia: NoticiaAdminItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NoticiaEditModal({
  isOpen,
  noticia,
  onClose,
  onSuccess,
}: NoticiaEditModalProps) {
  const { esVisible, setEsVisible, fechaExpiracion, setFechaExpiracion, isSubmitting, error, handleSubmit } =
    useNoticiaEditForm(noticia, onSuccess);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Noticia"
      maxWidth="md"
    >
      {noticia && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <NoticiaInfoCard titulo={noticia.libro_titulo} autor={noticia.autor_nombre} />

          <VisibilityToggle esVisible={esVisible} onChange={setEsVisible} />

          <ExpirationDatePicker value={fechaExpiracion} onChange={setFechaExpiracion} min={minDate} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-accent/10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
               type="submit"
               disabled={isSubmitting}
               className="w-auto justify-center flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
