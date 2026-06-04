"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import CompraItemCard from "./CompraItemCard";
import { fetchCompraDetalleExtraAction } from "@/app/(with-navbar)/historial-compras/actions";
import { formatPrecio } from "@/lib/utils/format";
import type { CompraConItems, CompraDetalleExtra } from "@/lib/types/compra";

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

const DELIVERY_STEPS = ["en preparacion", "enviado", "entregado"] as const;

const STEP_LABELS: Record<string, string> = {
  "en preparacion": "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
};

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

function PaymentSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-24 rounded-xl bg-brand-accent/5 animate-pulse"
        />
      ))}
    </div>
  );
}

function DeliverySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-accent/10 animate-pulse" />
            <div className="h-3 w-16 rounded bg-brand-accent/10 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-brand-accent/10 animate-pulse" />
        <div className="h-4 w-64 rounded bg-brand-accent/10 animate-pulse" />
      </div>
    </div>
  );
}

function MiniTarjetaCard({
  monto,
  ultimos_cuatro_digitos,
  nombre_titular,
}: {
  monto: number;
  ultimos_cuatro_digitos: string;
  nombre_titular: string | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-accent/15 bg-gradient-to-br from-white to-brand-bg p-4 shadow-sm">
      <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 rounded-bl-full" />
      <div className="relative flex items-start justify-between mb-4">
        <div className="w-9 h-6 rounded bg-gradient-to-br from-brand-accent/40 to-brand-accent/20 shadow-inner" />
        <CreditCard className="w-4 h-4 text-brand-accent/40" />
      </div>
      <div className="relative space-y-1">
        <p className="font-mono text-sm tracking-wider text-brand-text">
          **** **** **** {ultimos_cuatro_digitos}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-brand-secondary truncate">
            {nombre_titular || "Titular"}
          </p>
          <p className="text-sm font-bold text-brand-primary">
            {formatPrecio(monto)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DeliveryTimeline({ estado }: { estado: string }) {
  const currentIndex = DELIVERY_STEPS.indexOf(
    estado as (typeof DELIVERY_STEPS)[number],
  );

  return (
    <div className="flex items-center gap-0">
      {DELIVERY_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "bg-success border-success"
                    : "bg-transparent border-brand-accent/30"
                } ${isCurrent ? "ring-2 ring-success/20" : ""}`}
              />
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isCurrent
                    ? "text-brand-text"
                    : isCompleted
                      ? "text-success"
                      : "text-brand-accent/50"
                }`}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {index < DELIVERY_STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-16 h-0.5 mx-1 mb-5 ${
                  index < currentIndex ? "bg-success" : "bg-brand-accent/15"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CompraDetalleClient({
  initialData,
}: CompraDetalleClientProps) {
  const [extra, setExtra] = useState<CompraDetalleExtra | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [errorExtra, setErrorExtra] = useState(false);
  const [librosAbiertos, setLibrosAbiertos] = useState(false);
  const [subtotalAbierto, setSubtotalAbierto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchCompraDetalleExtraAction(initialData.id);
        if (!cancelled) setExtra(result);
      } catch {
        if (!cancelled) setErrorExtra(true);
      } finally {
        if (!cancelled) setLoadingExtra(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [initialData.id]);

  const subtotal = initialData.items.reduce(
    (sum, item) => sum + item.precio_unitario * item.cantidad,
    0,
  );

  return (
    <div
      className="space-y-6"
      style={{ animation: "fadeUp 0.5s ease-out both" }}>
      {/* Back button */}
      <Link
        href="/historial-compras"
        className="inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:text-brand-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al historial
      </Link>

      {/* Header */}
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

      {/* Price breakdown */}
      <section
        className="bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5"
        style={{ animation: "fadeUp 0.5s ease-out 0.3s both" }}>
        <h2 className="text-sm font-semibold text-brand-text mb-4">
          Resumen de precios
        </h2>
        {loadingExtra ? (
          <PriceSkeleton />
        ) : (
          <div className="space-y-2.5">
            <div>
              <button
                type="button"
                onClick={() => setSubtotalAbierto((prev) => !prev)}
                className="w-full flex items-center justify-between text-sm hover:bg-brand-bg/50 rounded-lg py-1 transition-colors">
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
                  {initialData.items.map((item, idx) => (
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
                  Envío (
                  {extra.entrega.tipo === "envio" ? "Delivery" : "Recogida"})
                </span>
                <span className="text-brand-text">
                  {extra.entrega.costo > 0
                    ? formatPrecio(extra.entrega.costo)
                    : "Gratis"}
                </span>
              </div>
            )}
            {initialData.id_promocion && (
              <div className="flex justify-between text-sm">
                <span className="text-brand-secondary">Promoción</span>
                <span className="text-success">Aplicada</span>
              </div>
            )}
            <div className="pt-2.5 mt-2.5 border-t border-brand-accent/10 flex justify-between">
              <span className="text-sm font-semibold text-brand-text">
                Total
              </span>
              <span className="text-base font-bold text-brand-primary">
                {formatPrecio(initialData.total)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Payment methods + Delivery side by side on desktop */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        style={{ animation: "fadeUp 0.5s ease-out 0.4s both" }}>
        {/* Payment methods */}
        <section className="order-2 lg:order-none bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">
              Métodos de pago
            </h2>
          </div>
          {loadingExtra ? (
            <PaymentSkeleton />
          ) : errorExtra || !extra?.tarjetas?.length ? (
            <p className="text-xs text-brand-secondary">
              No hay información de pago disponible.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {extra.tarjetas.map((tarjeta, index) => (
                <MiniTarjetaCard key={index} {...tarjeta} />
              ))}
            </div>
          )}
        </section>

        {/* Delivery */}
        <section className="order-1 lg:order-none bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-brand-accent" />
            <h2 className="text-sm font-semibold text-brand-text">
              Estado de entrega
            </h2>
          </div>
          {loadingExtra ? (
            <DeliverySkeleton />
          ) : errorExtra || !extra?.entrega ? (
            <p className="text-xs text-brand-secondary">
              No hay información de entrega disponible.
            </p>
          ) : (
            <div className="space-y-4">
              <DeliveryTimeline estado={extra.entrega.estado} />

              <div className="space-y-2 pt-2 border-t border-brand-accent/10">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-brand-accent" />
                  <span className="text-brand-secondary">Estimado:</span>
                  <span className="text-brand-text font-medium">
                    {formatFecha(extra.entrega.fecha_entrega_estimada)}
                  </span>
                </div>
                {extra.entrega.fecha_entregado && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span className="text-brand-secondary">Entregado:</span>
                    <span className="text-brand-text font-medium">
                      {formatFecha(extra.entrega.fecha_entregado)}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <Package className="w-3.5 h-3.5 text-brand-accent mt-0.5" />
                  <span className="text-brand-secondary">Dirección:</span>
                  <span className="text-brand-text">
                    {extra.entrega.direccion}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Return request */}
      <section
        className="bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5"
        style={{ animation: "fadeUp 0.5s ease-out 0.5s both" }}>
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
            <button
              disabled
              className="mt-3 px-4 py-2 text-xs font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-secondary/40 cursor-not-allowed"
              title="Próximamente disponible">
              Solicitar devolución
            </button>
          </div>
        </div>
      </section>

      {/* Books - Collapsible */}
      <section
        className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden"
        style={{ animation: "fadeUp 0.5s ease-out 0.6s both" }}>
        <button
          type="button"
          onClick={() => setLibrosAbiertos((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-brand-bg/50 transition-colors">
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
