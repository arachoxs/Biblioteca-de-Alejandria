"use client";

import {
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";
import { formatPrecio } from "@/lib/utils/format";
import type { CompraDetalleExtra } from "@/lib/types/compra";

interface CompraDeliverySectionProps {
  extra: CompraDetalleExtra | null;
  loadingExtra: boolean;
}

const DELIVERY_STEPS = ["en preparacion", "enviado", "entregado"] as const;
const STEP_LABELS: Record<string, string> = {
  "en preparacion": "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
};

function PaymentSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-brand-accent/5 animate-pulse" />
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

function formatFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
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

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-sm font-semibold text-brand-text">{title}</h2>
    </div>
  );
}

function DeliveryDetails({ entrega }: { entrega: { estado: string; fecha_entrega_estimada: string; fecha_entregado: string | null; direccion: string } }) {
  return (
    <div className="space-y-4">
      <DeliveryTimeline estado={entrega.estado} />
      <div className="space-y-2 pt-2 border-t border-brand-accent/10">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-3.5 h-3.5 text-brand-accent" />
          <span className="text-brand-secondary">Estimado:</span>
          <span className="text-brand-text font-medium">
            {formatFecha(entrega.fecha_entrega_estimada)}
          </span>
        </div>
        {entrega.fecha_entregado && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span className="text-brand-secondary">Entregado:</span>
            <span className="text-brand-text font-medium">
              {formatFecha(entrega.fecha_entregado)}
            </span>
          </div>
        )}
        <div className="flex items-start gap-2 text-sm">
          <Package className="w-3.5 h-3.5 text-brand-accent mt-0.5" />
          <span className="text-brand-secondary">Dirección:</span>
          <span className="text-brand-text">{entrega.direccion}</span>
        </div>
      </div>
    </div>
  );
}

export default function CompraDeliverySection({
  extra,
  loadingExtra,
}: CompraDeliverySectionProps) {
  const hasEntrega = !!extra?.entrega;
  const hasTarjetas = !!(extra?.tarjetas?.length);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="order-2 lg:order-none bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
        <SectionHeader icon={<CreditCard className="w-4 h-4 text-brand-accent" />} title="Métodos de pago" />
        {loadingExtra ? (
          <PaymentSkeleton />
        ) : hasTarjetas ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extra!.tarjetas!.map((tarjeta, index) => (
              <MiniTarjetaCard key={index} {...tarjeta} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-brand-secondary">
            No hay información de pago disponible.
          </p>
        )}
      </section>

      <section className="order-1 lg:order-none bg-white rounded-xl border border-brand-accent/15 shadow-sm p-5">
        <SectionHeader icon={<Truck className="w-4 h-4 text-brand-accent" />} title="Estado de entrega" />
        {loadingExtra ? (
          <DeliverySkeleton />
        ) : hasEntrega ? (
          <DeliveryDetails entrega={extra!.entrega!} />
        ) : (
          <p className="text-xs text-brand-secondary">
            No hay información de entrega disponible.
          </p>
        )}
      </section>
    </div>
  );
}
