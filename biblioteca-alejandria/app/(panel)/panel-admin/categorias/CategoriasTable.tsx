"use client";

import Table from "@/components/ui/Table";
import RowActions from "@/components/ui/RowActions";
import type { Column } from "@/components/ui/Table";
import type { CategoryWithBookCount } from "@/lib/types/category";
import { BookOpen, Loader2, Search, Tag } from "lucide-react";

interface CategoriasTableProps {
  data: CategoryWithBookCount[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  deletingId: number | null;
  onPageChange: (page: number) => void;
  onEdit: (category: CategoryWithBookCount) => void;
  onDelete: (category: CategoryWithBookCount) => void;
}

export default function CategoriasTable({
  data,
  isLoading,
  error,
  searchTerm,
  currentPage,
  totalPages,
  totalItems,
  deletingId,
  onPageChange,
  onEdit,
  onDelete,
}: CategoriasTableProps) {
  const categoryColumns: Column<CategoryWithBookCount>[] = [
    {
      header: "Nombre",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-text">{item.nombre}</span>
            <span className="text-xs text-brand-secondary/70 lg:hidden">
              {item.descripcion?.trim() || "Sin descripción"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Descripción",
      className: "hidden lg:table-cell whitespace-normal",
      render: (item) => (
        <span className="text-sm text-brand-secondary/90 leading-relaxed">
          {item.descripcion?.trim() || "Sin descripción"}
        </span>
      ),
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
    {
      header: "Acciones",
      render: (item) => (
        <RowActions
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          isDeleting={deletingId === item.id}
          editTitle="Editar categoría"
          deleteTitle="Eliminar categoría"
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando categorías...</p>
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
          <p className="font-medium">No se encontraron categorías</p>
          <p className="text-xs">Intenta ajustar tu término de búsqueda</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <BookOpen className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay categorías registradas</p>
        <p className="text-xs">
          Crea la primera categoría con el botón superior
        </p>
      </div>
    );
  };

  return (
    <Table
      data={data}
      columns={categoryColumns}
      keyExtractor={(item) => item.id}
      pagination={{
        currentPage,
        totalPages,
        onPageChange,
        totalItems,
      }}
      emptyMessage={renderEmptyState()}
    />
  );
}
