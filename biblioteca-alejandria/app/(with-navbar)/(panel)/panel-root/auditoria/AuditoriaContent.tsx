"use client";

import { useState, useEffect } from "react";
import { getAuditLogsAction } from "./action";
import type { AuditoriaRow } from "@/lib/types/audit";
import Table from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";
import Alert from "@/components/ui/Alert";
import { FileClock, Loader2, Search } from "lucide-react";

import JsonDataDisplay from "@/components/ui/JsonDataDisplay";

// ─── Columnas ──────────────────────────────────────────────────────

const accionBadge: Record<string, string> = {
  crear: "bg-green-50 text-green-700 border-green-200",
  modificar: "bg-amber-50 text-amber-700 border-amber-200",
  eliminar: "bg-red-50 text-red-700 border-red-200",
};

const accionLabel: Record<string, string> = {
  crear: "Crear",
  modificar: "Modificar",
  eliminar: "Eliminar",
};

const auditColumns: Column<AuditoriaRow>[] = [
  {
    header: "Fecha",
    render: (item) => {
      const d = new Date(item.fecha);
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-brand-text">
            {d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
          </span>
          <span className="text-xs text-brand-secondary/70">
            {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      );
    },
  },
  {
    header: "Actor",
    render: (item) => (
      <span className="text-sm font-medium text-brand-text truncate block max-w-xs" title={item.actor_email || item.id_usuario || "Desconocido"}>
        {item.actor_email || "Desconocido"}
      </span>
    ),
  },
  {
    header: "Acción",
    render: (item) => (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${accionBadge[item.accion] || "bg-gray-50 text-gray-700 border-gray-200"}`}
      >
        {accionLabel[item.accion] || item.accion}
      </span>
    ),
  },
  {
    header: "Descripción",
    render: (item) => (
      <span className="text-sm text-brand-text leading-snug">{item.descripcion}</span>
    ),
  },
  {
    header: "Entidad afectada",
    render: (item) => (
      <JsonDataDisplay 
        data={item.entidad_afectada}
        keyLabels={{
          id: "ID",
          entity_type: "Tipo",
          display_name: "Nombre/Email",
        }}
      />
    ),
  },
];

// ─── Componente ────────────────────────────────────────────────────

export default function AuditoriaContent() {
  const [data, setData] = useState<AuditoriaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const itemsPerPage = 10;

  const loadLogs = async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAuditLogsAction(page, itemsPerPage);
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.total);
      } else {
        setError(res.message || "Error al cargar registros");
        setData([]);
      }
    } catch {
      setError("Error inesperado al cargar registros de auditoría");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [currentPage]);

  // ─── Empty state ───────────────────────────────────────────────

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
      <div className="p-3 bg-brand-bg rounded-full">
        <Search className="w-6 h-6" />
      </div>
      <p className="font-medium">No hay registros de auditoría</p>
      <p className="text-xs">Las acciones administrativas aparecerán aquí automáticamente</p>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Auditoría
            </h1>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Historial de acciones administrativas del sistema.
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "registro" : "registros"})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 text-brand-secondary/60">
          <FileClock className="w-5 h-5" />
          <span className="text-sm">Solo lectura</span>
        </div>
      </div>

      {/* Table */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            <p className="text-brand-secondary">Cargando registros de auditoría...</p>
          </div>
        ) : (
          <Table
            data={data}
            columns={auditColumns}
            keyExtractor={(item) => item.id}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
              totalItems,
            }}
            emptyMessage={renderEmptyState()}
          />
        )}
      </div>
    </main>
  );
}
