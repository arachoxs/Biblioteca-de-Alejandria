"use client";

import Table from "@/components/ui/Table";
import RowActions from "@/components/ui/RowActions";
import { Search, BookOpen, Loader2 } from "lucide-react";
import type { LibroWithRelations } from "@/lib/types/libro";
import type { Column } from "@/components/ui/Table";

const libroColumns: Column<LibroWithRelations>[] = [
  {
    header: "Título",
    render: (item) => {
      const titulo = item.titulo || "Sin título";

      return (
        <div className="flex flex-col">
          <span className="font-semibold text-brand-text text-sm leading-tight max-w-[200px] truncate">
            {titulo}
          </span>
          <span className="text-xs text-brand-secondary/70 lg:hidden">
            {item.autor_nombre || "Sin autor"}
          </span>
        </div>
      );
    },
  },
  {
    header: "Autor",
    render: (item) => item.autor_nombre || "Sin autor",
    className: "hidden lg:table-cell",
  },
  {
    header: "ISBN",
    render: (item) => (
      <span className="font-mono text-xs text-brand-secondary">
        {item.isbn || "—"}
      </span>
    ),
    className: "hidden md:table-cell",
  },
  {
    header: "Categoría",
    render: (item) => (
      <span className="text-sm text-brand-text">
        {item.categoria_nombre || "Sin categoría"}
      </span>
    ),
    className: "hidden xl:table-cell",
  },
  {
    header: "Estado",
    render: (item) => {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          {item.estado === "nuevo" ? "Nuevo" : "Usado"}
        </span>
      );
    },
  },
  {
    header: "Copias",
    render: (item) => {
      const count = item.copias_count ?? 0;
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          <BookOpen className="w-3 h-3" />
          {count}
        </span>
      );
    },
  },
];

interface LibrosTableProps {
  data: LibroWithRelations[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onEdit?: (libro: LibroWithRelations) => void;
  onDelete?: (libro: LibroWithRelations) => void;
  deletingIds?: Set<string>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

export default function LibrosTable({
  data,
  isLoading,
  error,
  searchTerm,
  onEdit,
  onDelete,
  deletingIds = new Set(),
  pagination,
}: LibrosTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando libros...</p>
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
          <p className="font-medium">No se encontraron libros</p>
          <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay libros registrados</p>
        <p className="text-xs">Registra el primer libro usando el botón superior</p>
      </div>
    );
  };

  const hasActions = onEdit || onDelete;
  const columnsWithActions: Column<LibroWithRelations>[] = hasActions
    ? [
        ...libroColumns,
        {
          header: "Acciones",
          render: (item) => {
            const isDeleting = deletingIds.has(String(item.id));
            return (
              <RowActions
                onEdit={onEdit ? () => onEdit(item) : undefined}
                onDelete={onDelete ? () => onDelete(item) : undefined}
                isDeleting={isDeleting}
                editTitle="Editar libro"
                deleteTitle="Eliminar libro"
              />
            );
          },
        },
      ]
    : libroColumns;

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
