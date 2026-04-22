"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Table, { type Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SearchableSelect from "@/components/ui/SearchableSelect";
import type { InventarioCopiaDetalle, InventarioLibroItem, InventarioOption } from "@/lib/types/inventario";
import type { CopiaActionResponse } from "@/lib/types/copia";
import {
  deleteInventarioCopiasAction,
  getInventarioCopiasAction,
  transferInventarioCopiasAction,
} from "./action";
import { ArrowRightLeft, Loader2, Trash2 } from "lucide-react";

interface InventarioDetailModalProps {
  isOpen: boolean;
  libro: InventarioLibroItem | null;
  storeOptions: InventarioOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function getEstadoStyles(estado: InventarioCopiaDetalle["estado_copia"]): string {
  if (estado === "disponible") {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  }
  if (estado === "reservado") {
    return "bg-amber-100 text-amber-700 border-amber-300";
  }
  return "bg-red-100 text-red-700 border-red-300";
}

export default function InventarioDetailModal({
  isOpen,
  libro,
  storeOptions,
  onClose,
  onSuccess,
}: InventarioDetailModalProps) {
  const [copias, setCopias] = useState<InventarioCopiaDetalle[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [destinationStoreId, setDestinationStoreId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [actionState, setActionState] = useState<CopiaActionResponse | null>(null);

  const loadCopias = useCallback(async (libroId: string) => {
    setIsLoading(true);
    setActionState(null);

    try {
      const response = await getInventarioCopiasAction(libroId);
      if (response.success && response.data) {
        setCopias(response.data);
        return;
      }

      setCopias([]);
      setActionState({
        success: false,
        message: response.message ?? "No se pudo cargar el detalle de inventario.",
      });
    } catch (error) {
      console.error("Error cargando detalle de inventario:", error);
      setCopias([]);
      setActionState({
        success: false,
        message: "Ocurrió un error inesperado al cargar el detalle.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !libro) return;
    void loadCopias(libro.libro_id);
  }, [isOpen, libro, loadCopias]);

  const selectedCopias = useMemo(
    () => copias.filter((copia) => selectedIds.includes(copia.id_copia)),
    [copias, selectedIds],
  );

  const resetActions = () => {
    setSelectedIds([]);
    setDestinationStoreId("");
    setIsTransferMode(false);
    setActionState(null);
  };

  const handleClose = () => {
    resetActions();
    onClose();
  };

  const handleDeleteSelected = async () => {
    if (!libro || selectedIds.length === 0) return;

    const shouldDelete = window.confirm(
      `¿Confirmas eliminar ${selectedIds.length} copia${selectedIds.length === 1 ? "" : "s"} seleccionada${selectedIds.length === 1 ? "" : "s"}?`,
    );

    if (!shouldDelete) return;

    setIsProcessing(true);
    setActionState(null);

    try {
      const response = await deleteInventarioCopiasAction(selectedIds);
      setActionState(response);

      if (response.success) {
        onSuccess(response.message ?? "Copias eliminadas exitosamente.");
        resetActions();
        await loadCopias(libro.libro_id);
      }
    } catch {
      setActionState({
        success: false,
        message: "Ocurrió un error inesperado al eliminar copias.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferSelected = async () => {
    if (!libro || selectedIds.length === 0 || !destinationStoreId) return;

    const destinationStore = storeOptions.find(
      (store) => store.value === destinationStoreId,
    );
    const originStores = Array.from(
      new Set(selectedCopias.map((copia) => copia.nombre_tienda)),
    );

    const shouldTransfer = window.confirm(
      `¿Confirmas transferir ${selectedIds.length} copia${selectedIds.length === 1 ? "" : "s"} desde ${originStores.join(", ")} hacia ${destinationStore?.label ?? "la tienda destino"}?`,
    );

    if (!shouldTransfer) return;

    setIsProcessing(true);
    setActionState(null);

    try {
      const response = await transferInventarioCopiasAction(
        selectedIds,
        destinationStoreId,
      );
      setActionState(response);

      if (response.success) {
        onSuccess(response.message ?? "Copias transferidas exitosamente.");
        resetActions();
        await loadCopias(libro.libro_id);
      }
    } catch {
      setActionState({
        success: false,
        message: "Ocurrió un error inesperado al transferir copias.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<InventarioCopiaDetalle>[] = [
    {
      header: "ID copia",
      render: (item) => (
        <span className="font-mono text-xs text-brand-text">{item.id_copia}</span>
      ),
    },
    {
      header: "Tienda asociada",
      render: (item) => item.nombre_tienda,
    },
    {
      header: "Estado copia",
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getEstadoStyles(item.estado_copia)}`}
        >
          {item.estado_copia}
        </span>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Detalle de inventario${libro ? ` · ${libro.nombre_libro}` : ""}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {actionState?.message && (
          <Alert
            variant={actionState.success ? "success" : "error"}
            onClose={() => setActionState(null)}
          >
            {actionState.message}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            <p className="text-brand-secondary text-sm">Cargando copias...</p>
          </div>
        ) : (
          <Table
            data={copias}
            columns={columns}
            keyExtractor={(item) => item.id_copia}
            selection={{
              selectedIds,
              onSelectionChange: (ids) => setSelectedIds(ids.map(String)),
            }}
            emptyMessage="No hay copias activas para este libro."
          />
        )}

        {selectedIds.length > 0 && !isTransferMode && (
          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border border-brand-accent/20 rounded-xl p-3 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-sm text-brand-secondary">
                {selectedIds.length} copia{selectedIds.length === 1 ? "" : "s"} seleccionada
                {selectedIds.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="!w-auto px-4 py-2 text-sm !border-red-500/40 !text-red-600 hover:!bg-red-500/10"
                  onClick={handleDeleteSelected}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-1 inline" />
                  Eliminar
                </Button>
                <Button
                  type="button"
                  className="!w-auto px-4 py-2 text-sm inline-flex items-center gap-2"
                  onClick={() => setIsTransferMode(true)}
                  disabled={isProcessing}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferir
                </Button>
              </div>
            </div>
          </div>
        )}

        {selectedIds.length > 0 && isTransferMode && (
          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border border-brand-accent/20 rounded-xl p-3 shadow-lg space-y-3">
            <p className="text-sm text-brand-secondary">
              Selecciona la tienda de destino para {selectedIds.length} copia
              {selectedIds.length === 1 ? "" : "s"}.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <SearchableSelect
                id="transfer-destination-store"
                label="Tienda destino"
                value={destinationStoreId}
                options={storeOptions}
                onChange={setDestinationStoreId}
                placeholder="Selecciona la tienda destino"
                required
                disabled={isProcessing}
              />
              <Button
                type="button"
                className="!w-auto px-4 py-2 text-sm inline-flex items-center justify-center gap-2"
                onClick={handleTransferSelected}
                disabled={isProcessing || !destinationStoreId}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmar traslado
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!w-auto px-4 py-2 text-sm"
                onClick={() => {
                  setIsTransferMode(false);
                  setDestinationStoreId("");
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
