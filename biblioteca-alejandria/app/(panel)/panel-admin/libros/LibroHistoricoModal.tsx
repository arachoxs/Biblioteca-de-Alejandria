"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Table, { type Column } from "@/components/ui/Table";
import type { LibroWithRelations } from "@/lib/types/libro";
import type {
  HistoricoTimelineData,
  HistoricoTimelineSegment,
} from "@/lib/types/historico";
import { getLibroHistoricoTimelineAction } from "./action";

interface LibroHistoricoModalProps {
  isOpen: boolean;
  libro: LibroWithRelations | null;
  onClose: () => void;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(dateISO: string): string {
  return dateTimeFormatter.format(new Date(dateISO));
}

function getSegmentClasses(estado: "disponible" | "agotado"): string {
  return estado === "disponible"
    ? "bg-green-600 hover:bg-green-700"
    : "bg-red-600 hover:bg-red-700";
}

function getEstadoBadgeClasses(estado: "disponible" | "agotado"): string {
  return estado === "disponible"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-red-100 text-red-800 border-red-300";
}

function formatDuration(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  if (totalMinutes <= 0) return "< 1 min";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} d${hours > 0 ? ` ${hours} h` : ""}`;
  }

  if (hours > 0) {
    return `${hours} h${minutes > 0 ? ` ${minutes} min` : ""}`;
  }

  return `${minutes} min`;
}

function buildSegmentAriaLabel(segment: HistoricoTimelineSegment): string {
  const estadoLabel = segment.estado === "disponible" ? "Disponible" : "Agotado";
  return `${estadoLabel}. Desde ${formatDate(segment.start_at)} hasta ${formatDate(segment.end_at)}.`;
}

interface HistoricoLogTableRow {
  id: number;
  estado: HistoricoTimelineData["logs"][number]["estado"];
  fecha: string;
  vigente_hasta: string;
  duration_ms: number;
  is_current: boolean;
}

export default function LibroHistoricoModal({
  isOpen,
  libro,
  onClose,
}: LibroHistoricoModalProps) {
  const [timeline, setTimeline] = useState<HistoricoTimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async (libroId: string) => {
    setIsLoading(true);
    setError(null);
    setTimeline(null);

    try {
      const response = await getLibroHistoricoTimelineAction(libroId);

      if (response.success && response.data) {
        setTimeline(response.data);
        return;
      }

      setError(response.message ?? "No se pudo cargar el historial del libro.");
    } catch (loadError) {
      console.error("Error cargando timeline histórico:", loadError);
      setError("Ocurrió un error inesperado al cargar el histórico.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !libro) return;
    void loadTimeline(String(libro.id));
  }, [isOpen, libro, loadTimeline]);

  const timelineSummary = useMemo(() => {
    if (!timeline) return null;

    const totalDuration = Math.max(
      1,
      new Date(timeline.timeline_end_at).getTime() -
      new Date(timeline.timeline_start_at).getTime(),
    );

    return {
      totalDuration,
      startLabel: formatDate(timeline.timeline_start_at),
      endLabel: formatDate(timeline.timeline_end_at),
    };
  }, [timeline]);

  const historicoRows = useMemo<HistoricoLogTableRow[]>(() => {
    if (!timeline) return [];

    return timeline.logs.map((log, index) => {
      const nextLog = timeline.logs[index + 1];
      const endAt = nextLog?.fecha ?? timeline.timeline_end_at;

      return {
        id: log.id,
        estado: log.estado,
        fecha: log.fecha,
        vigente_hasta: endAt,
        duration_ms: Math.max(0, new Date(endAt).getTime() - new Date(log.fecha).getTime()),
        is_current: !nextLog,
      };
    });
  }, [timeline]);

  const logColumns = useMemo<Column<HistoricoLogTableRow>[]>(
    () => [
      {
        header: "Estado",
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getEstadoBadgeClasses(item.estado)}`}
          >
            {item.estado === "disponible" ? "Disponible" : "Agotado"}
          </span>
        ),
      },
      {
        header: "Fecha del cambio",
        render: (item) => formatDate(item.fecha),
      },
      {
        header: "Vigente hasta",
        render: (item) =>
          item.is_current ? (
            <span className="text-brand-primary font-medium">
              Actualidad ({formatDate(item.vigente_hasta)})
            </span>
          ) : (
            formatDate(item.vigente_hasta)
          ),
      },
      {
        header: "Duración",
        render: (item) => formatDuration(item.duration_ms),
      },
    ],
    [],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico de disponibilidad${libro ? ` · ${libro.titulo}` : ""}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            <p className="text-sm text-brand-secondary">Cargando histórico...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && timeline && timelineSummary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-brand-accent/20 bg-brand-bg p-3">
                <p className="text-xs text-brand-secondary">Inicio</p>
                <p className="text-sm font-semibold text-brand-text mt-1">
                  {timelineSummary.startLabel}
                </p>
              </div>
              <div className="rounded-xl border border-brand-accent/20 bg-brand-bg p-3">
                <p className="text-xs text-brand-secondary">Fin</p>
                <p className="text-sm font-semibold text-brand-text mt-1">
                  {timelineSummary.endLabel}
                </p>
              </div>
              <div className="rounded-xl border border-brand-accent/20 bg-brand-bg p-3">
                <p className="text-xs text-brand-secondary">Tramos registrados</p>
                <p className="text-sm font-semibold text-brand-text mt-1">
                  {timeline.segments.length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-brand-accent/20 p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-brand-primary">
                  <CalendarRange className="w-4 h-4" />
                  <h3 className="text-sm font-semibold">Línea temporal del ciclo de vida</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-brand-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    Disponible
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    Agotado
                  </span>
                </div>
              </div>

              <div
                className="h-9 w-full overflow-hidden rounded-lg border border-brand-accent/20 bg-brand-bg flex"
                role="list"
                aria-label="Tramos del histórico de disponibilidad"
              >
                {timeline.segments.map((segment, index) => (
                  <div
                    key={`${segment.estado}-${segment.start_at}-${segment.end_at}-${index}`}
                    className={`h-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 ${getSegmentClasses(segment.estado)}`}
                    style={{
                      flexGrow: Math.max(segment.duration_ms, 1),
                      flexBasis: 0,
                    }}
                    role="listitem"
                    tabIndex={0}
                    aria-label={buildSegmentAriaLabel(segment)}
                    title={`${segment.estado === "disponible" ? "Disponible" : "Agotado"}: ${formatDate(segment.start_at)} → ${formatDate(segment.end_at)}`}
                  />
                ))}
              </div>

              <div className="mt-2 flex justify-between text-xs text-brand-secondary">
                <span>{timelineSummary.startLabel}</span>
                <span>{timelineSummary.endLabel}</span>
              </div>

              <p className="mt-3 text-xs text-brand-secondary">
                Puedes navegar por los tramos con Tab o revisar el detalle en la tabla
                de logs.
              </p>
            </div>

            <div className="rounded-xl border border-brand-accent/20 p-4 bg-white">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-primary">
                  Logs de la tabla histórico
                </h3>
                <span className="text-xs text-brand-secondary">
                  {historicoRows.length} registro{historicoRows.length === 1 ? "" : "s"}
                </span>
              </div>

              <Table
                data={historicoRows}
                columns={logColumns}
                keyExtractor={(item) => item.id}
                className="shadow-none"
                emptyMessage="No hay logs para mostrar."
              />
            </div>
          </>
        )}

        {!isLoading && !error && !timeline && (
          <div className="rounded-lg border border-brand-accent/20 bg-brand-bg p-4 text-sm text-brand-secondary">
            No hay registros históricos para este libro.
          </div>
        )}
      </div>
    </Modal>
  );
}
