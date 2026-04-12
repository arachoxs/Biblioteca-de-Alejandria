"use client";

import { Pencil, Trash2, Loader2 } from "lucide-react";
import React from "react";

interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  editTitle?: string;
  deleteTitle?: string;
}

/**
 * Componente reutilizable para los botones de acción en las filas de las tablas (Editar/Eliminar).
 * 
 * @param onEdit Callback invocado al hacer click en Editar
 * @param onDelete Callback invocado al hacer click en Eliminar
 * @param isDeleting Indica si la fila está en proceso de eliminación (muestra loader)
 * @param editTitle Título para el tooltip del botón Editar
 * @param deleteTitle Título para el tooltip del botón Eliminar
 */
export default function RowActions({
  onEdit,
  onDelete,
  isDeleting = false,
  editTitle = "Editar",
  deleteTitle = "Eliminar",
}: RowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Botón Editar */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title={editTitle}
          className="flex items-center justify-center p-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-all cursor-pointer ring-1 ring-brand-primary/20 shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Botón Eliminar */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          title={deleteTitle}
          className="flex items-center justify-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 transition-all cursor-pointer ring-1 ring-red-500/20 shadow-sm disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
