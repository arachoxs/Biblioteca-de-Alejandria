"use client";

import Table, { type Column } from "@/components/ui/Table";
import type { InventarioLibroItem } from "@/lib/types/inventario";
import { BookOpen, Boxes, Eye, Loader2, Search } from "lucide-react";

interface InventarioTableProps {
  data: InventarioLibroItem[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  onViewDetail: (item: InventarioLibroItem) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

function getCondicionLabel(
  condicion: InventarioLibroItem["estado_libro"],
): string {
  return condicion === "nuevo" ? "Nuevo" : "Usado";
}

export default function InventarioTable({
  data,
  isLoading,
  error,
  searchTerm,
  onViewDetail,
  pagination,
}: InventarioTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando inventario...</p>
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

  const columns: Column<InventarioLibroItem>[] = [
    {
      header: "ISBN",
      render: (item) => (
        <span className="font-mono text-xs text-brand-text">
          {item.isbn_libro}
        </span>
      ),
    },
    {
      header: "Nombre del libro",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-brand-text text-sm">
            {item.nombre_libro}
          </span>
          <span className="text-xs text-brand-secondary/70 lg:hidden">
            {item.autor_libro}
          </span>
        </div>
      ),
    },
    {
      header: "Autor",
      className: "hidden lg:table-cell",
      render: (item) => item.autor_libro,
    },
    {
      header: "Estado del libro",
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          {getCondicionLabel(item.estado_libro)}
        </span>
      ),
    },
    {
      header: "Cantidad total",
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg--primary/10 text-brand-primary border-brand-primary/20">
          <BookOpen className="w-3 h-3" />
          {item.cantidad_total}
        </span>
      ),
    },
    {
      header: "Cantidad disponible",
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
          <BookOpen className="w-3 h-3" />
          {item.cantidad_disponible}
        </span>
      ),
    },
    {
      header: "Acción",
      render: (item) => (
        <button
          type="button"
          onClick={() => onViewDetail(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-all cursor-pointer ring-1 ring-brand-primary/20 shadow-sm">
          <Eye className="w-4 h-4" />
          Ver detalle
        </button>
      ),
    },
  ];

  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
          <div className="p-3 bg-brand-bg rounded-full">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-medium">No se encontró inventario</p>
          <p className="text-xs">
            Prueba ajustando la búsqueda o la tienda seleccionada
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <Boxes className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay inventario registrado</p>
        <p className="text-xs">Agrega inventario con el botón superior</p>
      </div>
    );
  };

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(item) => item.libro_id}
      emptyMessage={renderEmptyState()}
      pagination={pagination}
    />
  );
}
