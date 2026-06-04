"use client";

import { RotateCcw } from "lucide-react";
import SolicitarDevolucionModal from "@/components/devolucion/SolicitarDevolucionModal";
import type { ItemDevolucionElegible } from "@/lib/types/devolucion";

interface CompraReturnSectionProps {
  compraId: string;
  puedeDevolver: boolean;
  entregaEstado: string | undefined;
  itemsElegibles: ItemDevolucionElegible[] | null;
  loadingElegibles: boolean;
  modalOpen: boolean;
  onAbrirDevolucion: () => void;
  onCerrarModal: () => void;
}

export default function CompraReturnSection({
  compraId,
  puedeDevolver,
  entregaEstado,
  itemsElegibles,
  loadingElegibles,
  modalOpen,
  onAbrirDevolucion,
  onCerrarModal,
}: CompraReturnSectionProps) {
  return (
    <>
      <section className="bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-brand-text">
              ¿Problemas con tu compra?
            </h2>
            <p className="text-xs text-brand-secondary mt-1 leading-relaxed">
              Si alguno de tus libros no llegó en buen estado o tienes algún
              inconveniente, puedes solicitar una devolución.
            </p>
            {puedeDevolver ? (
              <button
                onClick={onAbrirDevolucion}
                disabled={loadingElegibles}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-text hover:border-brand-primary hover:text-brand-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loadingElegibles ? (
                  <>
                    <span className="w-3 h-3 border-2 border-brand-accent/30 border-t-brand-primary rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Solicitar devolución"
                )}
              </button>
            ) : (
              <p className="mt-3 text-xs text-brand-secondary/60">
                {entregaEstado !== "entregado"
                  ? "La devolución estará disponible una vez se entregue el pedido."
                  : "El plazo para solicitar una devolución ha vencido (8 días)."}
              </p>
            )}
          </div>
        </div>
      </section>

      {modalOpen && itemsElegibles && (
        <SolicitarDevolucionModal
          isOpen={modalOpen}
          onClose={onCerrarModal}
          idCompra={compraId}
          items={itemsElegibles}
        />
      )}
    </>
  );
}
