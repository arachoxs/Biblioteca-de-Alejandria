"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, ImageIcon, Pencil, Search, Newspaper, Loader2 } from "lucide-react";
import type { NoticiaAdminItem, ReorderItem } from "@/lib/types/noticia";

// ─── Sortable Row Component ────────────────────────────────────────

interface SortableRowProps {
  noticia: NoticiaAdminItem;
  onEdit: (noticia: NoticiaAdminItem) => void;
  onManageImages: (noticia: NoticiaAdminItem) => void;
}

function SortableRow({ noticia, onEdit, onManageImages }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: noticia.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imagenesCount = (noticia.imagenes as string[])?.length ?? 0;
  
  // Compute expiration warning outside of render
  const isExpiringSoon = noticia.fecha_expiracion
    ? new Date(noticia.fecha_expiracion).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
    : false;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group transition-colors duration-150 ${
        isDragging ? "bg-brand-primary/5 shadow-lg" : "hover:bg-brand-bg/40"
      }`}
    >
      {/* Drag Handle */}
      <td className="px-4 py-4 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded text-brand-secondary/40 hover:text-brand-secondary hover:bg-brand-bg transition-colors"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>

      {/* Título */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-semibold text-brand-text text-sm leading-tight max-w-[200px] truncate">
            {noticia.libro_titulo || "Sin título"}
          </span>
          <span className="text-xs text-brand-secondary/70">
            {noticia.autor_nombre || "Sin autor"}
          </span>
        </div>
      </td>

      {/* Visibilidad */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {noticia.es_visible ? (
            <Eye className="w-4 h-4 text-brand-primary" />
          ) : (
            <EyeOff className="w-4 h-4 text-brand-secondary/40" />
          )}
          <span className={`text-sm ${noticia.es_visible ? "text-brand-primary" : "text-brand-secondary/60"}`}>
            {noticia.es_visible ? "Visible" : "Oculta"}
          </span>
        </div>
      </td>

      {/* Expiración */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isExpiringSoon ? "text-amber-600 font-medium" : "text-brand-secondary"}`}>
            {noticia.fecha_expiracion
              ? new Date(noticia.fecha_expiracion).toLocaleDateString("es-ES")
              : "Sin fecha"}
          </span>
          {isExpiringSoon && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Pronto
            </span>
          )}
        </div>
      </td>

      {/* Imágenes */}
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          <ImageIcon className="w-3 h-3" />
          {imagenesCount}/10
        </span>
      </td>

      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(noticia)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-all cursor-pointer ring-1 ring-brand-primary/20 shadow-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onManageImages(noticia)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent transition-all cursor-pointer ring-1 ring-brand-accent/20 shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
            Imágenes
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Table Component ──────────────────────────────────────────

interface NoticiasTableProps {
  data: NoticiaAdminItem[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onEdit?: (noticia: NoticiaAdminItem) => void;
  onManageImages?: (noticia: NoticiaAdminItem) => void;
  onReorder?: (items: ReorderItem[]) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

export default function NoticiasTable({
  data,
  isLoading,
  error,
  searchTerm,
  onEdit,
  onManageImages,
  onReorder,
  pagination,
}: NoticiasTableProps) {
  const [localData, setLocalData] = useState<NoticiaAdminItem[]>(data);

  // Sync local data with props
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = localData.findIndex((item) => item.id === active.id);
      const newIndex = localData.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newData = [...localData];
      const [movedItem] = newData.splice(oldIndex, 1);
      newData.splice(newIndex, 0, movedItem);

      // Update local state optimistically
      setLocalData(newData);

      // Create reorder items with new order
      const reorderItems: ReorderItem[] = newData.map((item, index) => ({
        id: item.id,
        orden: index + 1,
      }));

      // Call reorder handler
      onReorder?.(reorderItems);
    },
    [localData, onReorder]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando noticias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-red-600">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
          <div className="p-3 bg-brand-bg rounded-full">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-medium">No se encontraron noticias</p>
          <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <Newspaper className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay noticias registradas</p>
        <p className="text-xs">Las noticias se crean automáticamente al registrar un libro</p>
      </div>
    );
  };

  if (localData.length === 0) {
    return (
      <div className="w-full border border-brand-accent/20 rounded-xl bg-white shadow-sm">
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full border border-brand-accent/20 rounded-xl bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-bg border-b border-brand-accent/20">
              <tr>
                <th className="px-4 py-4 font-semibold text-brand-primary w-10"></th>
                <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">
                  Libro
                </th>
                <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">
                  Visibilidad
                </th>
                <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">
                  Expiración
                </th>
                <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">
                  Imágenes
                </th>
                <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-accent/10">
              <SortableContext
                items={localData.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
              >
                {localData.map((noticia) => (
                  <SortableRow
                    key={noticia.id}
                    noticia={noticia}
                    onEdit={onEdit || (() => {})}
                    onManageImages={onManageImages || (() => {})}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-brand-accent/10 bg-brand-bg/50">
            <p className="text-xs text-brand-secondary font-medium">
              Página <span className="text-brand-primary">{pagination.currentPage}</span> de{" "}
              <span className="text-brand-primary">{pagination.totalPages}</span>
              {pagination.totalItems !== undefined && pagination.totalItems !== null && (
                <span className="hidden sm:inline">
                  {" "}
                  • <span className="text-brand-primary">{pagination.totalItems}</span> resultados
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
                aria-label="Anterior"
              >
                ←
              </button>

              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5) {
                    if (pagination.currentPage > 3) {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - 4 + i;
                    }
                  }
                  return pageNum;
                }).map((page) => (
                  <button
                    key={page}
                    onClick={() => pagination.onPageChange(page)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                      pagination.currentPage === page
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                        : "bg-transparent text-brand-secondary hover:bg-brand-bg hover:text-brand-text"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
                aria-label="Siguiente"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
