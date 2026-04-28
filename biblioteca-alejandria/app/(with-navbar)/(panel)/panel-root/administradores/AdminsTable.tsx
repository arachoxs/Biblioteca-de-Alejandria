"use client";

import Table from "@/components/ui/Table";
import { Search, UserX, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { AdminUserFromView } from "@/lib/types/profile";
import type { Column } from "@/components/ui/Table";

// Definición de columnas de la tabla
const adminColumns: Column<AdminUserFromView>[] = [
  {
    header: "Nombre",
    render: (item) => {
      const nombreCompleto = `${item.nombre_completo || "sin nombre"}`;
      const iniciales = nombreCompleto
        .split(" ")
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
              {nombreCompleto}
            </span>
            <span className="text-xs text-brand-secondary/70 lg:hidden">
              {item.email || "Sin email"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    header: "Email",
    render: (item) => item.email || "Sin email",
    className: "hidden lg:table-cell",
  },
  {
    header: "Rol",
    render: (item) => (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-brand-primary/10 text-brand-primary border-brand-primary/20">
        {item.rol || "ADMINISTRADOR"}
      </span>
    ),
  },
  {
    header: "Estado",
    render: (item) => {
      // Manejar explícitamente el caso null/undefined para evitar marcar como habilitado por defecto
      if (item.habilitado == null) {
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200"
          >
            Desconocido
          </span>
        );
      }

      const isEnabled = item.habilitado === true;
      return (
        <span 
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isEnabled 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {isEnabled ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Habilitado
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5" />
              Inhabilitado
            </>
          )}
        </span>
      );
    },
  },
  {
    header: "Fecha de creación",
    render: (item) => {
      if (!item.created_at) return "Sin fecha";
      const date = new Date(item.created_at);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    },
  },
];

interface AdminsTableProps {
  data: AdminUserFromView[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  selectedIds: (string | number)[];
  onPageChange: (page: number) => void;
  onSelectionChange: (ids: (string | number)[]) => void;
}

/**
 * Componente de presentación para la tabla de administradores.
 * 
 * Este componente es "tonto" - solo se encarga de renderizar la tabla
 * con los datos que recibe por props. No maneja estado ni lógica de negocio.
 */
export default function AdminsTable({
  data,
  isLoading,
  error,
  searchTerm,
  currentPage,
  totalPages,
  totalItems,
  selectedIds,
  onPageChange,
  onSelectionChange,
}: AdminsTableProps) {
  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
        <p className="text-brand-secondary">Cargando administradores...</p>
      </div>
    );
  }

  // Estado de error (opcional, se puede manejar en el padre)
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-red-600">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  // Empty state - con búsqueda
  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
          <div className="p-3 bg-brand-bg rounded-full">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-medium">No se encontraron administradores</p>
          <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
        </div>
      );
    }

    // Empty state - sin datos
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
        <div className="p-3 bg-brand-bg rounded-full">
          <UserX className="w-6 h-6" />
        </div>
        <p className="font-medium">No hay administradores registrados</p>
        <p className="text-xs">Crea el primer administrador usando el botón superior</p>
      </div>
    );
  };

  return (
    <Table
      data={data}
      columns={adminColumns}
      keyExtractor={(item) => item.id}
      pagination={{
        currentPage,
        totalPages,
        onPageChange,
        totalItems,
      }}
      selection={{
        selectedIds,
        onSelectionChange,
      }}
      emptyMessage={renderEmptyState()}
    />
  );
}
