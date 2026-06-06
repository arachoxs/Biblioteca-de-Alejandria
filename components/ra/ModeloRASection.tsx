"use client";

import { useCallback, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import {
  Box,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
} from "lucide-react";
import {
  DEFAULT_ANCHO,
  DEFAULT_ALTO,
  calculateProfundidad,
} from "@/lib/types/modelo_ra";

// ─── Props ─────────────────────────────────────────────────────────

interface ModeloRASectionProps {
  /** Cantidad de páginas del libro (para calcular profundidad). */
  paginas: number;
  /** Si el componente está deshabilitado (enviando formulario). */
  disabled?: boolean;
  /** Errores de validación por campo. */
  errors?: Record<string, string>;
  /** Valores actuales de dimensiones (controlado desde el padre). */
  dimensiones: { ancho: string; alto: string };
  /** Callback para actualizar dimensiones en el padre. */
  onDimensionesChange: (field: "ancho" | "alto", value: string) => void;
  /** Texturas existentes (URLs) para previsualización en modo edición. */
  existingTexturas?: {
    portada: string | null;
    contraportada: string | null;
    lomo: string | null;
  };
  /** Callback cuando cambian los archivos de textura. */
  onTexturasChange: (files: Partial<Record<"portada" | "contraportada" | "lomo", File>>) => void;
}

// ─── Preview de textura individual ─────────────────────────────────

interface TexturePreviewProps {
  label: string;
  tipo: "portada" | "contraportada" | "lomo";
  existingUrl: string | null;
  disabled?: boolean;
  onFileSelect: (tipo: "portada" | "contraportada" | "lomo", file: File | null) => void;
}

function TexturePreview({
  label,
  tipo,
  existingUrl,
  disabled,
  onFileSelect,
}: TexturePreviewProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (file) {
        const url = URL.createObjectURL(file);
        setPreview(url);
        onFileSelect(tipo, file);
      } else {
        setPreview(existingUrl);
        onFileSelect(tipo, null);
      }
    },
    [existingUrl, onFileSelect, tipo],
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    onFileSelect(tipo, null);
  }, [onFileSelect, tipo]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-brand-primary tracking-wide">
        {label}
      </label>
      <div className="relative group">
        {preview ? (
          <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-brand-accent/20 bg-brand-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <label
            htmlFor={`ra-textura-${tipo}`}
            className={`flex flex-col items-center justify-center w-full aspect-[3/4] rounded-lg border-2 border-dashed
              border-brand-accent/30 hover:border-brand-primary/50 bg-brand-bg/50 hover:bg-brand-bg
              transition-all duration-300 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            <ImagePlus className="w-8 h-8 text-brand-accent/50 mb-2" />
            <span className="text-xs text-brand-secondary text-center px-2">
              Subir {label.toLowerCase()}
            </span>
          </label>
        )}
        <input
          id={`ra-textura-${tipo}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────

export default function ModeloRASection({
  paginas,
  disabled = false,
  errors = {},
  dimensiones,
  onDimensionesChange,
  existingTexturas,
  onTexturasChange,
}: ModeloRASectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [texturaFiles, setTexturaFiles] = useState<
    Partial<Record<"portada" | "contraportada" | "lomo", File>>
  >({});

  const profundidad = calculateProfundidad(paginas || 0);

  const handleFileSelect = useCallback(
    (tipo: "portada" | "contraportada" | "lomo", file: File | null) => {
      setTexturaFiles((prev) => {
        const next = { ...prev };
        if (file) {
          next[tipo] = file;
        } else {
          delete next[tipo];
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    onTexturasChange(texturaFiles);
  }, [texturaFiles, onTexturasChange]);

  return (
    <section className="bg-white rounded-xl border border-brand-accent/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-brand-bg/50 transition-colors rounded-xl cursor-pointer">
        <div className="flex items-center gap-3">
          <Box className="w-5 h-5 text-brand-primary" />
          <div>
            <h2 className="text-lg font-bold text-brand-primary font-display tracking-tight">
              Modelo de Realidad Aumentada
            </h2>
            <p className="text-xs text-brand-secondary mt-0.5">
              Dimensiones y texturas para visualización 3D del libro.
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-brand-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-brand-secondary" />
        )}
      </button>

      {/* Contenido colapsable */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-6 border-t border-brand-accent/10 pt-5">
          {/* ── Dimensiones ──────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-bold text-brand-primary mb-3">
              Dimensiones (cm)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="ra-ancho"
                label="Ancho"
                type="number"
                min={5}
                max={50}
                step="0.1"
                placeholder={`${DEFAULT_ANCHO}`}
                value={dimensiones.ancho}
                onChange={(e) => onDimensionesChange("ancho", e.target.value)}
                error={errors.dimensiones_ancho}
                disabled={disabled}
              />
              <Input
                id="ra-alto"
                label="Alto"
                type="number"
                min={5}
                max={50}
                step="0.1"
                placeholder={`${DEFAULT_ALTO}`}
                value={dimensiones.alto}
                onChange={(e) => onDimensionesChange("alto", e.target.value)}
                error={errors.dimensiones_alto}
                disabled={disabled}
              />
              <Input
                id="ra-profundidad"
                label="Profundidad"
                type="number"
                value={profundidad.toFixed(2)}
                disabled
              />
            </div>
            <p className="text-xs text-brand-secondary mt-2">
              La profundidad se calcula automáticamente: {paginas || 0} páginas × 0.007 = {profundidad.toFixed(2)} cm
            </p>
          </div>

          {/* ── Texturas ────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-bold text-brand-primary mb-3">
              Texturas
            </h3>
            <p className="text-xs text-brand-secondary mb-4">
              Sube las imágenes para cada cara del libro. Si no se proporcionan, se usarán texturas blancas genéricas.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <TexturePreview
                label="Portada"
                tipo="portada"
                existingUrl={existingTexturas?.portada ?? null}
                disabled={disabled}
                onFileSelect={handleFileSelect}
              />
              <TexturePreview
                label="Contraportada"
                tipo="contraportada"
                existingUrl={existingTexturas?.contraportada ?? null}
                disabled={disabled}
                onFileSelect={handleFileSelect}
              />
              <TexturePreview
                label="Lomo"
                tipo="lomo"
                existingUrl={existingTexturas?.lomo ?? null}
                disabled={disabled}
                onFileSelect={handleFileSelect}
              />
            </div>
            {errors.texturas && (
              <p className="text-xs text-red-500 mt-2">{errors.texturas}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
