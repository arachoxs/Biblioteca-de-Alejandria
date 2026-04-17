"use client";

import Table from "@/components/ui/Table";
import RowActions from "@/components/ui/RowActions";
import type { Column } from "@/components/ui/Table";
import type { TiendaDia, TiendaWithDireccion } from "@/lib/types/tienda";
import { TIENDA_DIA_LABELS, TIENDA_DIAS } from "@/lib/types/tienda";
import { Loader2, Search, Store } from "lucide-react";

interface TiendasTableProps {
  data: TiendaWithDireccion[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  deletingIds?: Set<string>;
  onEdit: (tienda: TiendaWithDireccion) => void;
  onDelete: (tienda: TiendaWithDireccion) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

function buildHorarioSummary(tienda: TiendaWithDireccion): string {
  const openDays = TIENDA_DIAS.filter((day) => tienda.horario[day] !== null);

  if (openDays.length === 0) {
    return "Sin atención";
  }

  if (openDays.length === 7) {
    const baseRange = tienda.horario.lunes;
    if (baseRange) {
      return `Todos los días · ${baseRange.apertura} - ${baseRange.cierre}`;
    }
    return "Todos los días";
  }

  const firstDay = openDays[0] as TiendaDia;
  const firstRange = tienda.horario[firstDay];
  const firstDayLabel = TIENDA_DIA_LABELS[firstDay];
  if (!firstRange) {
    return `${openDays.length} días habilitados`;
  }

  return `${openDays.length} días · ${firstDayLabel}: ${firstRange.apertura} - ${firstRange.cierre}`;
}

export default function TiendasTable({
  data,
  isLoading,
  error,
  searchTerm,
  deletingIds = new Set(),
  onEdit,
  onDelete,
  pagination,
}: TiendasTableProps) {
  const columns: Column<TiendaWithDireccion>[] = [
    {
      header: "Nombre",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary ring-2 ring-brand-bg">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-text text-sm">
              {item.nombre}
            </span>
            <span className="text-xs text-brand-secondary/70 lg:hidden">
              ID dirección: {item.id_direccion}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Dirección",
      className: "hidden lg:table-cell whitespace-normal",
      render: (item) => (
        <span className="text-sm text-brand-secondary/90">
          {item.direccion_formateada || "Sin dirección registrada"}
        </span>
      ),
    },
    {
      header: "Horario",
      className: "whitespace-normal",
      render: (item) => (
        <span className="text-xs md:text-sm text-brand-secondary/90 leading-relaxed">
          {buildHorarioSummary(item)}
        </span>
      ),
    },
    {
      header: "Acciones",
      render: (item) => (
        <RowActions
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
          isDeleting={deletingIds.has(item.id)}
          editTitle="Editar tienda"
          deleteTitle="Eliminar tienda"
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando tiendas...</p>
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
          <p className="font-medium">No se encontraron tiendas</p>
          <p className="text-xs">Intenta ajustar el término de búsqueda</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <Store className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay tiendas registradas</p>
        <p className="text-xs">Crea la primera tienda con el botón superior</p>
      </div>
    );
  };

  return (
    <Table
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
      pagination={pagination}
      emptyMessage={renderEmptyState()}
    />
  );
}
