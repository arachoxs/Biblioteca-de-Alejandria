"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Upload, X, Loader2, ImageIcon, AlertTriangle } from "lucide-react";
import { subirImagenAction, eliminarImagenAction } from "./actions";
import type { NoticiaAdminItem } from "@/lib/types/noticia";

interface NoticiaImagesModalProps {
  isOpen: boolean;
  noticia: NoticiaAdminItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NoticiaImagesModal({
  isOpen,
  noticia,
  onClose,
  onSuccess,
}: NoticiaImagesModalProps) {
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize images when noticia changes
  useEffect(() => {
    if (noticia) {
      setImagenes((noticia.imagenes as string[]) ?? []);
      setError(null);
      setConfirmDelete(null);
    }
  }, [noticia]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !noticia) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo excede el tamaño máximo de 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }

    // Validate max images
    if (imagenes.length >= 10) {
      setError("Máximo 10 imágenes por noticia");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("imagen", file);

      const result = await subirImagenAction(noticia.id, formData);

      if (result.success && result.url) {
        setImagenes((prev) => [...prev, result.url!]);
        onSuccess();
      } else {
        setError(result.message || "Error subiendo imagen");
      }
    } catch {
      setError("Error inesperado al subir la imagen");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteClick = (url: string) => {
    setConfirmDelete(url);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || !noticia) return;

    setIsDeleting(confirmDelete);
    setError(null);

    try {
      const result = await eliminarImagenAction(noticia.id, confirmDelete);

      if (result.success) {
        setImagenes((prev) => prev.filter((img) => img !== confirmDelete));
        setConfirmDelete(null);
        onSuccess();
      } else {
        setError(result.message || "Error eliminando imagen");
      }
    } catch {
      setError("Error inesperado al eliminar la imagen");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Imágenes"
      maxWidth="2xl"
    >
      {noticia && (
        <div className="space-y-6">
          {/* Libro info */}
          <div className="bg-brand-bg rounded-lg p-4">
            <p className="text-sm text-brand-secondary">Libro</p>
            <p className="font-semibold text-brand-text">
              {noticia.libro_titulo || "Sin título"}
            </p>
          </div>

          {/* Contador */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-secondary">
              <span className="font-semibold text-brand-primary">{imagenes.length}</span>
              /10 imágenes
            </p>
            {imagenes.length >= 10 && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Límite alcanzado
              </span>
            )}
          </div>

          {/* Grid de imágenes */}
          {imagenes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagenes.map((url, index) => (
                <div
                  key={url}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-brand-accent/20 bg-brand-bg"
                >
                  <img
                    src={url}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(url)}
                      disabled={isDeleting === url}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      aria-label="Eliminar imagen"
                    >
                      {isDeleting === url ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60 border-2 border-dashed border-brand-accent/20 rounded-lg">
              <ImageIcon className="w-10 h-10" />
              <p className="font-medium">No hay imágenes</p>
              <p className="text-xs">Sube la primera imagen usando el botón de abajo</p>
            </div>
          )}

          {/* Upload area */}
          {imagenes.length < 10 && (
            <div className="flex items-center justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/50 transition-all cursor-pointer ${
                  isUploading ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Subir imagen
                  </>
                )}
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Confirm delete dialog */}
          {confirmDelete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">¿Eliminar imagen?</p>
                  <p className="text-sm text-amber-700">
                    Esta acción no se puede deshacer. La imagen se eliminará permanentemente.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelDelete}
                  disabled={isDeleting !== null}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting !== null}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-brand-accent/10">
            <Button
              type="button"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
