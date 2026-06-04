"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import CompraItemCard from "./CompraItemCard";
import CompraPriceSection from "./sections/CompraPriceSection";
import CompraDeliverySection from "./sections/CompraDeliverySection";
import CompraReturnSection from "./sections/CompraReturnSection";
import {
  fetchCompraDetalleExtraAction,
  fetchItemsElegiblesDevolucionAction,
} from "@/app/(with-navbar)/historial-compras/actions";
import type { CompraConItems, CompraDetalleExtra } from "@/lib/types/compra";
import type { ItemDevolucionElegible } from "@/lib/types/devolucion";

interface CompraDetalleClientProps {
  initialData: CompraConItems;
}

function formatFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}

export default function CompraDetalleClient({
  initialData,
}: CompraDetalleClientProps) {
  const [extra, setExtra] = useState<CompraDetalleExtra | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [librosAbiertos, setLibrosAbiertos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemsElegibles, setItemsElegibles] = useState<
    ItemDevolucionElegible[] | null
  >(null);
  const [loadingElegibles, setLoadingElegibles] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchCompraDetalleExtraAction(initialData.id);
        if (!cancelled) setExtra(result);
      } catch {
        // extra stays null on error
      } finally {
        if (!cancelled) setLoadingExtra(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [initialData.id]);

  const entregaEstado = extra?.entrega?.estado;
  const fechaEntregado = extra?.entrega?.fecha_entregado;

  const puedeDevolver = useMemo(() => {
    if (entregaEstado !== "entregado" || !fechaEntregado) return false;
    const entregaTime = new Date(fechaEntregado).getTime();
    const ahora = Date.now(); // eslint-disable-line react-hooks/purity
    const diffMs = ahora - entregaTime;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    return diffDias <= 8;
  }, [entregaEstado, fechaEntregado]);

  async function handleAbrirDevolucion() {
    setLoadingElegibles(true);
    try {
      const elegibles = await fetchItemsElegiblesDevolucionAction(
        initialData.id,
      );
      setItemsElegibles(elegibles);
      setModalOpen(true);
    } catch {
      setItemsElegibles(null);
    } finally {
      setLoadingElegibles(false);
    }
  }

  return (
    <div
      className="space-y-6"
      style={{ animation: "fadeUp 0.5s ease-out both" }}>
      <Link
        href="/historial-compras"
        className="inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:text-brand-primary cursor-pointer transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al historial
      </Link>

      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-4 border-b border-brand-accent/10"
        style={{ animation: "fadeUp 0.5s ease-out 0.1s both" }}>
        <div>
          <h1 className="text-xl font-display font-semibold text-brand-text">
            Detalle de Compra
          </h1>
          <p className="text-sm text-brand-secondary mt-0.5">
            {formatFecha(initialData.fecha)}
          </p>
        </div>
        <p className="text-xs font-mono text-brand-accent">
          #{initialData.id.slice(0, 8)}
        </p>
      </div>

      <div style={{ animation: "fadeUp 0.5s ease-out 0.3s both" }}>
        <CompraPriceSection
          compra={initialData}
          extra={extra}
          loadingExtra={loadingExtra}
        />
      </div>

      <div style={{ animation: "fadeUp 0.5s ease-out 0.4s both" }}>
        <CompraDeliverySection
          extra={extra}
          loadingExtra={loadingExtra}
        />
      </div>

      <div style={{ animation: "fadeUp 0.5s ease-out 0.5s both" }}>
        <CompraReturnSection
          compraId={initialData.id}
          puedeDevolver={puedeDevolver}
          entregaEstado={entregaEstado}
          itemsElegibles={itemsElegibles}
          loadingElegibles={loadingElegibles}
          modalOpen={modalOpen}
          onAbrirDevolucion={handleAbrirDevolucion}
          onCerrarModal={() => setModalOpen(false)}
        />
      </div>

      <section
        className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden"
        style={{ animation: "fadeUp 0.5s ease-out 0.6s both" }}>
        <button
          type="button"
          onClick={() => setLibrosAbiertos((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-brand-bg/50 cursor-pointer transition-colors">
          <h2 className="text-sm font-semibold text-brand-text">
            {initialData.items.length}{" "}
            {initialData.items.length === 1 ? "libro" : "libros"}
          </h2>
          <ChevronDown
            className={`w-4 h-4 text-brand-accent transition-transform duration-200 ${
              librosAbiertos ? "rotate-180" : ""
            }`}
          />
        </button>
        {librosAbiertos && (
          <div className="border-t border-brand-accent/10">
            {initialData.items.map((item, index) => (
              <CompraItemCard
                key={item.libro?.id ?? `item-${index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
