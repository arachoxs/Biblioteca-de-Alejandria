"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrecio } from "@/lib/utils/format";
import type { CompraConItems, CompraDetalleExtra } from "@/lib/types/compra";

interface CompraPriceSectionProps {
  compra: CompraConItems;
  extra: CompraDetalleExtra | null;
  loadingExtra: boolean;
}

function PriceSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between">
          <div className="h-4 w-24 rounded bg-brand-accent/10 animate-pulse" />
          <div className="h-4 w-16 rounded bg-brand-accent/10 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function PriceDetails({
  compra,
  extra,
}: {
  compra: CompraConItems;
  extra: CompraDetalleExtra | null;
}) {
  const [subtotalAbierto, setSubtotalAbierto] = useState(false);

  const subtotal = compra.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0,
  );

  return (
    <div className="space-y-2.5">
      <div>
        <button
          type="button"
          onClick={() => setSubtotalAbierto((prev) => !prev)}
          className="w-full flex items-center justify-between text-sm hover:bg-brand-bg/50 rounded-lg py-1 cursor-pointer transition-colors">
          <span className="text-brand-secondary flex items-center gap-1.5">
            Subtotal
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                subtotalAbierto ? "rotate-180" : ""
              }`}
            />
          </span>
          <span className="text-brand-text font-medium">
            {formatPrecio(subtotal)}
          </span>
        </button>
        {subtotalAbierto && (
          <div className="mt-2 ml-2 pl-3 border-l-2 border-brand-accent/15 space-y-1.5">
            {compra.items.map((item, idx) => (
              <div
                key={item.libro?.id ?? idx}
                className="flex items-center justify-between text-xs">
                <span className="text-brand-secondary truncate max-w-[70%]">
                  {item.libro?.titulo ?? "Libro"} × {item.cantidad}
                </span>
                <span className="text-brand-text font-medium">
                  {formatPrecio(item.precio_unitario * item.cantidad)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {extra?.entrega && (
        <div className="flex justify-between text-sm">
          <span className="text-brand-secondary">
            Envío ({extra.entrega.tipo === "envio" ? "Delivery" : "Recogida"})
          </span>
          <span className="text-brand-text">
            {extra.entrega.costo > 0 ? formatPrecio(extra.entrega.costo) : "Gratis"}
          </span>
        </div>
      )}
      {compra.id_promocion && (
        <div className="flex justify-between text-sm">
          <span className="text-brand-secondary">Promoción</span>
          <span className="text-success">Aplicada</span>
        </div>
      )}
      <div className="pt-2.5 mt-2.5 border-t border-brand-accent/10 flex justify-between">
        <span className="text-sm font-semibold text-brand-text">Total</span>
        <span className="text-base font-bold text-brand-primary">
          {formatPrecio(compra.total)}
        </span>
      </div>
    </div>
  );
}

export default function CompraPriceSection({
  compra,
  extra,
  loadingExtra,
}: CompraPriceSectionProps) {
  return (
    <section className="bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-brand-text mb-4">
        Resumen de precios
      </h2>
      {loadingExtra ? <PriceSkeleton /> : <PriceDetails compra={compra} extra={extra} />}
    </section>
  );
}
