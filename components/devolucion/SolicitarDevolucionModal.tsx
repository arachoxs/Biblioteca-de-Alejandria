"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { solicitarDevolucionAction } from "@/app/(with-navbar)/historial-compras/actions";
import PasoSeleccion from "./steps/SolicitarDevolucionSeleccion";
import PasoMotivos from "./steps/SolicitarDevolucionMotivos";
import PasoConfirmacion from "./steps/SolicitarDevolucionConfirmacion";
import PasoResultado from "./steps/SolicitarDevolucionResultado";
import type {
  ItemDevolucionElegible,
  MotivoDevolucion,
} from "@/lib/types/devolucion";

interface SolicitarDevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  idCompra: string;
  items: ItemDevolucionElegible[];
}

type Paso = "seleccion" | "motivos" | "confirmacion" | "exito" | "error";

interface ItemSeleccionado {
  id_copia: string;
  motivo: MotivoDevolucion;
  descripcion_motivo: string;
}

export default function SolicitarDevolucionModal({
  isOpen,
  onClose,
  idCompra,
  items,
}: SolicitarDevolucionModalProps) {
  const [paso, setPaso] = useState<Paso>("seleccion");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [motivos, setMotivos] = useState<Record<string, ItemSeleccionado>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  function toggleSeleccion(id_copia: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id_copia)) {
        next.delete(id_copia);
      } else {
        next.add(id_copia);
        if (!motivos[id_copia]) {
          setMotivos((m) => ({
            ...m,
            [id_copia]: {
              id_copia,
              motivo: "producto en mal estado",
              descripcion_motivo: "",
            },
          }));
        }
      }
      return next;
    });
  }

  function actualizarMotivo(
    id_copia: string,
    campo: "motivo" | "descripcion_motivo",
    valor: string,
  ) {
    setMotivos((prev) => ({
      ...prev,
      [id_copia]: { ...prev[id_copia], [campo]: valor },
    }));
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    const itemsPayload = Array.from(seleccionados).map((id_copia) => ({
      id_copia,
      motivo: motivos[id_copia].motivo,
      descripcion_motivo: motivos[id_copia].descripcion_motivo || undefined,
    }));

    const result = await solicitarDevolucionAction(idCompra, itemsPayload);

    setIsSubmitting(false);

    if (result.success) {
      setPaso("exito");
    } else {
      const code = result.errors?.general ?? result.errors?.items ?? "Error desconocido";
      setErrorMessage(code);
      setPaso("error");
    }
  }

  function handleClose() {
    setPaso("seleccion");
    setSeleccionados(new Set());
    setMotivos({});
    setErrorMessage(null);
    onClose();
  }

  function renderPaso() {
    switch (paso) {
      case "seleccion":
        return (
          <PasoSeleccion
            items={items}
            seleccionados={seleccionados}
            onToggle={toggleSeleccion}
          />
        );
      case "motivos":
        return (
          <PasoMotivos
            seleccionados={seleccionados}
            items={items}
            motivos={motivos}
            onUpdateMotivo={actualizarMotivo}
          />
        );
      case "confirmacion":
        return (
          <PasoConfirmacion
            seleccionados={seleccionados}
            items={items}
            motivos={motivos}
          />
        );
      case "exito":
        return <PasoResultado tipo="exito" errorMessage={null} />;
      case "error":
        return <PasoResultado tipo="error" errorMessage={errorMessage} />;
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-accent/10">
          <h2 className="text-lg font-display font-semibold text-brand-text">
            Solicitar devolución
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-brand-bg cursor-pointer transition-colors">
            <X className="w-5 h-5 text-brand-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderPaso()}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-accent/10">
          {paso === "seleccion" && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-brand-secondary hover:text-brand-text cursor-pointer transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => setPaso("motivos")}
                disabled={seleccionados.size === 0}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Continuar
              </button>
            </>
          )}

          {paso === "motivos" && (
            <>
              <button
                onClick={() => setPaso("seleccion")}
                className="px-4 py-2 text-sm text-brand-secondary hover:text-brand-text cursor-pointer transition-colors">
                Atrás
              </button>
              <button
                onClick={() => setPaso("confirmacion")}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 cursor-pointer transition-colors">
                Continuar
              </button>
            </>
          )}

          {paso === "confirmacion" && (
            <>
              <button
                onClick={() => setPaso("motivos")}
                className="px-4 py-2 text-sm text-brand-secondary hover:text-brand-text cursor-pointer transition-colors">
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar devolución"
                )}
              </button>
            </>
          )}

          {(paso === "exito" || paso === "error") && (
            <button
              onClick={handleClose}
              className="ml-auto px-5 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 cursor-pointer transition-colors">
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
