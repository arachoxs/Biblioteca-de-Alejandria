"use client";

import Table from "@/components/ui/Table";
import RowActions from "@/components/ui/RowActions";
import { Search, BookOpen, Loader2 } from "lucide-react";
import type { AuthorWithBookCount } from "@/lib/types/author";
import type { Column } from "@/components/ui/Table";

// Definición de columnas de la tabla
const authorColumns: Column<AuthorWithBookCount>[] = [
  {
    header: "Nombre",
    render: (item) => {
      const nombre = item.nombre || "Sin nombre";
      // filter(Boolean) evita crash con espacios múltiples o nombres de una sola palabra
      const iniciales = nombre
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs ring-2 ring-brand-bg">
            {iniciales}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-text text-sm">
              {nombre}
            </span>
            <span className="text-xs text-brand-secondary/70 lg:hidden">
              {item.nacionalidad || "Sin nacionalidad"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    header: "Nacionalidad",
    render: (item) => item.nacionalidad || "Sin nacionalidad",
    className: "hidden lg:table-cell",
  },
  {
    header: "Fecha de nacimiento",
    render: (item) => {
      if (!item.fecha_nacimiento) return "Sin fecha";
      const date = new Date(item.fecha_nacimiento + "T00:00:00");
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    header: "Libros",
    render: (item) => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
        <BookOpen className="w-3 h-3" />
        {item.libro_count}
      </span>
    ),
  },
];

interface AutoresTableProps {
  data: AuthorWithBookCount[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onRowClick?: (author: AuthorWithBookCount) => void;
  onEdit?: (author: AuthorWithBookCount) => void;
  onDelete?: (author: AuthorWithBookCount) => void;
  /** Set de IDs siendo eliminados actualmente (soporta borrados concurrentes). */
  deletingIds?: Set<number>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

/**
 * Componente de presentación para la tabla de autores.
 * Reutiliza el componente genérico `Table` siguiendo el mismo patrón
 * que `AdminsTable.tsx`.
 */
export default function AutoresTable({
  data,
  isLoading,
  error,
  searchTerm,
  onRowClick,
  onEdit,
  onDelete,
  deletingIds = new Set(),
  pagination,
}: AutoresTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando autores...</p>
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
          <p className="font-medium">No se encontraron autores</p>
          <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay autores registrados</p>
        <p className="text-xs">Crea el primer autor usando el botón superior</p>
      </div>
    );
  };

  const hasActions = onEdit || onDelete || onRowClick;
  const columnsWithActions: Column<AuthorWithBookCount>[] = hasActions
    ? [
        ...authorColumns,
        {
          header: "Acciones",
          render: (item) => {
            const isDeleting = deletingIds.has(item.id);
            const handleEdit = onEdit ? () => onEdit(item) : (onRowClick ? () => onRowClick(item) : undefined);

            return (
              <RowActions
                onEdit={handleEdit}
                onDelete={onDelete ? () => onDelete(item) : undefined}
                isDeleting={isDeleting}
                editTitle="Editar autor"
                deleteTitle="Eliminar autor"
              />
            );
          },
        },
      ]
    : authorColumns;

  return (
    <Table
      data={data}
      columns={columnsWithActions}
      keyExtractor={(item) => item.id}
      emptyMessage={renderEmptyState()}
      pagination={pagination}
    />
  );
}
