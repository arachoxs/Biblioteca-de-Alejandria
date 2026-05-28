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
import Pagination from "@/components/ui/Pagination";
import type { NoticiaAdminItem, ReorderItem } from "@/lib/types/noticia";

// ─── Helpers ───────────────────────────────────────────────────────

function getExpirationStatus(fechaExpiracion: string | null | undefined) {
  if (!fechaExpiracion) return { isExpired: false, isExpiringSoon: false };
  const expiry = new Date(fechaExpiracion).getTime();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const isExpired = expiry < now;
  const isExpiringSoon = !isExpired && expiry - now < ONE_DAY;
  return { isExpired, isExpiringSoon };
}

// ─── Cell Components ───────────────────────────────────────────────

function VisibilityCell({ esVisible }: { esVisible: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {esVisible ? (
        <Eye className="w-4 h-4 text-brand-primary" />
      ) : (
        <EyeOff className="w-4 h-4 text-brand-secondary/40" />
      )}
      <span className={`text-sm ${esVisible ? "text-brand-primary" : "text-brand-secondary/60"}`}>
        {esVisible ? "Visible" : "Oculta"}
      </span>
    </div>
  );
}

function ExpirationBadge({ isExpired, isExpiringSoon, fechaExpiracion }: { isExpired: boolean; isExpiringSoon: boolean; fechaExpiracion: string | null | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : "text-brand-secondary"}`}>
        {fechaExpiracion
          ? new Date(fechaExpiracion).toLocaleDateString("es-ES")
          : "Sin fecha"}
      </span>
      {isExpired && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          Expirada
        </span>
      )}
      {!isExpired && isExpiringSoon && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Pronto
        </span>
      )}
    </div>
  );
}

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
  const { isExpired, isExpiringSoon } = getExpirationStatus(noticia.fecha_expiracion);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group transition-colors duration-150 ${
        isDragging ? "bg-brand-primary/5 shadow-lg" : "hover:bg-brand-bg/40"
      }`}
    >
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

      <td className="px-6 py-4">
        <VisibilityCell esVisible={noticia.es_visible} />
      </td>

      <td className="px-6 py-4">
        <ExpirationBadge isExpired={isExpired} isExpiringSoon={isExpiringSoon} fechaExpiracion={noticia.fecha_expiracion} />
      </td>

      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          <ImageIcon className="w-3 h-3" />
          {imagenesCount}/10
        </span>
      </td>

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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-all cursor-pointer ring-1 ring-brand-primary/20 shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
            Imágenes
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── State Components ──────────────────────────────────────────────

function NoticiasTableLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      <p className="text-brand-secondary">Cargando noticias...</p>
    </div>
  );
}

function NoticiasTableError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-red-600">
      <p className="font-medium">{message}</p>
    </div>
  );
}

function NoticiasTableEmpty({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="w-full border border-brand-accent/20 rounded-xl bg-white shadow-sm">
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          {hasSearch ? <Search className="w-6 h-6" /> : <Newspaper className="w-6 h-6" />}
        </div>
        <p className="font-medium">
          {hasSearch ? "No se encontraron noticias" : "No hay noticias registradas"}
        </p>
        <p className="text-xs">
          {hasSearch
            ? "Intenta ajustar los filtros de búsqueda"
            : "Las noticias se crean automáticamente al registrar un libro"}
        </p>
      </div>
    </div>
  );
}

// ─── Drag & Drop Hook ─────────────────────────────────────────────

function useTableDragDrop(
  localData: NoticiaAdminItem[],
  setLocalData: React.Dispatch<React.SetStateAction<NoticiaAdminItem[]>>,
  onReorder?: (items: ReorderItem[]) => void
) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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
      setLocalData(newData);

      const reorderItems: ReorderItem[] = newData.map((item, index) => ({
        id: item.id,
        orden: index + 1,
      }));
      onReorder?.(reorderItems);
    },
    [localData, onReorder]
  );

  return { sensors, handleDragEnd };
}

// ─── Table Header ─────────────────────────────────────────────────

function TableHeader() {
  return (
    <thead className="bg-brand-bg border-b border-brand-accent/20">
      <tr>
        <th className="px-4 py-4 font-semibold text-brand-primary w-10"></th>
        <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">Libro</th>
        <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">Visibilidad</th>
        <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">Expiración</th>
        <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">Imágenes</th>
        <th className="px-6 py-4 font-semibold text-brand-primary tracking-wide">Acciones</th>
      </tr>
    </thead>
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

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const { sensors, handleDragEnd } = useTableDragDrop(localData, setLocalData, onReorder);

  if (isLoading) return <NoticiasTableLoading />;
  if (error) return <NoticiasTableError message={error} />;
  if (localData.length === 0) return <NoticiasTableEmpty hasSearch={!!searchTerm} />;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full border border-brand-accent/20 rounded-xl bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <TableHeader />
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

        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            onPageChange={pagination.onPageChange}
          />
        )}
      </div>
    </DndContext>
  );
}
