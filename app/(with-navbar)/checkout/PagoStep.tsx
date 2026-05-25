"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  CreditCard,
  AlertCircle,
  Check,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  getUserTarjetasAction,
  validatePaymentAllocationAction,
} from "./actions";
import type { TarjetaPaymentAllocation } from "@/lib/types/checkout";

interface PagoStepProps {
  totalAmount: number;
  onConfirm: (allocations: TarjetaPaymentAllocation[]) => void;
  onBack: () => void;
}

interface TarjetaDisplay {
  id: number;
  nombre_titular: string;
  ultimos_cuatro_digitos: string;
  mes_caducidad: number;
  ano_caducidad: number;
  saldo: number;
}

const PRICE_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
});

function formatPrice(price: number): string {
  return PRICE_FORMATTER.format(price);
}

type PagoStepStatus = "loading" | "ready" | "error";

export default function PagoStep({
  totalAmount,
  onConfirm,
  onBack,
}: PagoStepProps) {
  const [allTarjetas, setAllTarjetas] = useState<TarjetaDisplay[]>([]);
  const [status, setStatus] = useState<PagoStepStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Map<number, number>>(
    new Map(),
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus("loading");
      setErrorMsg(null);
      const result = await getUserTarjetasAction();
      if (!ignore) {
        if (result.success && result.tarjetas) {
          setAllTarjetas(result.tarjetas);
          setStatus(result.tarjetas.length === 0 ? "error" : "ready");
          if (result.tarjetas.length === 0) {
            setErrorMsg(
              "No tienes tarjetas registradas. Agrega una en tu perfil.",
            );
          }
        } else {
          setErrorMsg(result.error ?? "Error al cargar las tarjetas.");
          setStatus("error");
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const selectedTarjetaIds = useMemo(
    () => new Set(allocations.keys()),
    [allocations],
  );

  const availableTarjetasForModal = useMemo(
    () => allTarjetas.filter((t) => !selectedTarjetaIds.has(t.id)),
    [allTarjetas, selectedTarjetaIds],
  );

  const selectedTarjetas = useMemo(
    () => allTarjetas.filter((t) => selectedTarjetaIds.has(t.id)),
    [allTarjetas, selectedTarjetaIds],
  );

  const totalAllocated = useMemo(
    () => Array.from(allocations.values()).reduce((sum, m) => sum + m, 0),
    [allocations],
  );

  const diferencia = totalAmount - totalAllocated;
  const isComplete =
    Math.abs(diferencia) <= 1 &&
    selectedTarjetas.every((t) => {
      const val = allocations.get(t.id) ?? 0;
      return val >= 0 && val <= t.saldo;
    });
  const progressPercent =
    totalAmount > 0 ? Math.min(100, (totalAllocated / totalAmount) * 100) : 0;

  const handleAmountChange = (tarjetaId: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, "");
    const monto = cleanValue === "" ? 0 : parseInt(cleanValue, 10);
    setAllocations((prev) => {
      const next = new Map(prev);
      if (monto === 0) {
        next.delete(tarjetaId);
      } else {
        next.set(tarjetaId, monto);
      }
      return next;
    });
  };

  const handleAddTarjeta = (tarjetaId: number) => {
    setAllocations((prev) => {
      const next = new Map(prev);
      next.set(tarjetaId, 0);
      return next;
    });
    setModalOpen(false);
  };

  const handleRemoveTarjeta = (tarjetaId: number) => {
    setAllocations((prev) => {
      const next = new Map(prev);
      next.delete(tarjetaId);
      return next;
    });
  };

  const handleValidateAndConfirm = async () => {
    if (!isComplete || submitting) return;

    const allocationArray: TarjetaPaymentAllocation[] = Array.from(
      allocations.entries(),
    ).map(([id_tarjeta, monto]) => ({ id_tarjeta, monto }));

    setSubmitting(true);
    const validation = await validatePaymentAllocationAction(
      allocationArray,
      totalAmount,
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setSubmitting(false);
      return;
    }

    setValidationErrors({});
    onConfirm(allocationArray);
    setSubmitting(false);
  };

  if (status === "loading") {
    return <LoadingSkeletonPago />;
  }

  if (status === "error") {
    return (
      <ErrorViewPago
        message={errorMsg ?? "Error al cargar las tarjetas."}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <TotalBadge
        totalAmount={totalAmount}
        totalAllocated={totalAllocated}
        diferencia={diferencia}
        isComplete={isComplete}
        progressPercent={progressPercent}
      />

      <SectionDividerPago label="Método de pago" />

      {selectedTarjetas.length === 0 ? (
        <EmptyPaymentState onAddCard={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          {selectedTarjetas.map((tarjeta, index) => {
            const monto = allocations.get(tarjeta.id) ?? 0;
            const hasError = Boolean(
              validationErrors[`tarjeta_${tarjeta.id}`] ||
              (monto > tarjeta.saldo && monto > 0),
            );
            const isInsufficient = monto > tarjeta.saldo && monto > 0;
            const isFilled = monto > 0 && !hasError;

            return (
              <div
                key={tarjeta.id}
                className="relative bg-white rounded-2xl p-5 transition-all duration-200 checkout-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}>
                <button
                  type="button"
                  onClick={() => handleRemoveTarjeta(tarjeta.id)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center text-brand-secondary/40 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isFilled
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                        : "bg-brand-accent/8 text-brand-secondary"
                    }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-semibold text-brand-text leading-tight">
                          •••• {tarjeta.ultimos_cuatro_digitos}
                        </p>
                        <p className="text-xs text-brand-secondary/50 mt-0.5">
                          {tarjeta.nombre_titular} ·{" "}
                          {tarjeta.mes_caducidad.toString().padStart(2, "0")}/
                          {tarjeta.ano_caducidad}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xs font-semibold ${isInsufficient ? "text-red-500" : "text-emerald-600"}`}>
                          {formatPrice(tarjeta.saldo)}
                        </p>
                        <p className="text-[10px] text-brand-secondary/30">
                          disponible
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-secondary/30 font-medium">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            monto === 0 ? "" : monto.toLocaleString("es-CO")
                          }
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            handleAmountChange(tarjeta.id, raw);
                          }}
                          placeholder="0"
                          className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 text-sm font-semibold placeholder:text-brand-secondary/20 transition-all ${
                            hasError
                              ? "border-red-300 bg-red-50/50 text-red-700 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                              : isFilled
                                ? "border-brand-primary/30 bg-brand-primary/4 text-brand-text focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                                : "border-brand-accent/12 bg-brand-bg/50 text-brand-text focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/5"
                          }`}
                        />
                      </div>
                    </div>

                    {isInsufficient && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <p className="text-xs text-red-500 font-medium">
                          Saldo insuficiente
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={availableTarjetasForModal.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-white border-2 border-dashed border-brand-accent/30 rounded-2xl text-sm font-medium text-brand-secondary/60 hover:border-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/4 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" />
            Añadir tarjeta
          </button>
        </div>
      )}

      {validationErrors.form && (
        <div className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200/60 rounded-xl py-3 px-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {validationErrors.form}
        </div>
      )}

      <CheckoutActionsFooterPago
        isComplete={isComplete}
        submitting={submitting}
        onBack={onBack}
        onConfirm={handleValidateAndConfirm}
      />

      <SelectCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        availableTarjetas={availableTarjetasForModal}
        onSelect={handleAddTarjeta}
      />
    </div>
  );
}

function SelectCardModal({
  isOpen,
  onClose,
  availableTarjetas,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  availableTarjetas: TarjetaDisplay[];
  onSelect: (tarjetaId: number) => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar tarjeta"
      maxWidth="2xl">
      <div className="space-y-3">
        {availableTarjetas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-brand-secondary/60">
              No hay más tarjetas disponibles.
            </p>
          </div>
        ) : (
          availableTarjetas.map((tarjeta, index) => (
            <button
              key={tarjeta.id}
              type="button"
              onClick={() => onSelect(tarjeta.id)}
              className="w-full text-left bg-white rounded-2xl border-2 border-brand-accent/10 p-5 hover:border-brand-primary/40 hover:shadow-md hover:shadow-brand-primary/5 transition-all cursor-pointer group checkout-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:shadow-md group-hover:shadow-brand-primary/20 transition-all">
                  <CreditCard className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-semibold text-brand-text leading-tight">
                    •••• {tarjeta.ultimos_cuatro_digitos}
                  </p>
                  <p className="text-xs text-brand-secondary/50 mt-0.5">
                    {tarjeta.nombre_titular} ·{" "}
                    {tarjeta.mes_caducidad.toString().padStart(2, "0")}/
                    {tarjeta.ano_caducidad}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatPrice(tarjeta.saldo)}
                  </p>
                  <p className="text-[10px] text-brand-secondary/30">
                    disponible
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-brand-accent/20 group-hover:border-brand-primary/40 transition-colors flex items-center justify-center">
                  <Plus className="w-3 h-3 text-brand-secondary/30 group-hover:text-brand-primary/60 transition-colors" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

function TotalBadge({
  totalAmount,
  totalAllocated,
  diferencia,
  isComplete,
  progressPercent,
}: {
  totalAmount: number;
  totalAllocated: number;
  diferencia: number;
  isComplete: boolean;
  progressPercent: number;
}) {
  const barColor = isComplete
    ? "from-emerald-400 to-emerald-500"
    : diferencia > 1
      ? "from-amber-400 to-amber-500"
      : "from-red-400 to-red-500";

  return (
    <div className="relative bg-gradient-to-r from-brand-primary/[0.04] to-transparent rounded-2xl border border-brand-primary/10 overflow-hidden checkout-fade-in">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary/40 to-brand-accent/20" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-brand-secondary/40 mb-1">
              Total a pagar
            </p>
            <p className="font-display text-2xl font-bold text-brand-text leading-none tabular-nums">
              {formatPrice(totalAmount)}
            </p>
          </div>
          <div className="shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <CreditCard className="w-5 h-5 text-brand-primary" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-secondary/50 font-medium">
              Asignado
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-semibold tabular-nums ${isComplete ? "text-emerald-600" : diferencia > 1 ? "text-amber-600" : "text-red-600"}`}>
                {formatPrice(totalAllocated)}
              </span>
              <span className="text-brand-secondary/30">/</span>
              <span className="text-brand-secondary/50 tabular-nums">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-brand-accent/8 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${barColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {diferencia > 1 && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Faltan {formatPrice(diferencia)}
            </p>
          )}
          {diferencia < -1 && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Exceso de {formatPrice(Math.abs(diferencia))}
            </p>
          )}
          {Math.abs(diferencia) <= 1 && totalAllocated > 0 && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Distribución completa
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionDividerPago({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/30 font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-brand-accent/8" />
    </div>
  );
}

function EmptyPaymentState({ onAddCard }: { onAddCard: () => void }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-bg border-2 border-dashed border-brand-accent/30 flex items-center justify-center mb-4">
        <CreditCard className="w-6 h-6 text-brand-accent/50" />
      </div>
      <p className="text-sm font-medium text-brand-secondary/70 mb-1">
        Sin tarjetas seleccionadas
      </p>
      <p className="text-xs text-brand-secondary/40 max-w-xs leading-relaxed">
        Selecciona una tarjeta para asignar el monto de tu compra.
      </p>
      <button
        type="button"
        onClick={onAddCard}
        className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 transition-all cursor-pointer">
        <Plus className="w-4 h-4" />
        Seleccionar tarjeta
      </button>
    </div>
  );
}

function LoadingSkeletonPago() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-brand-accent/10 p-5 animate-pulse">
        <div className="h-5 w-32 bg-brand-accent/10 rounded mb-3" />
        <div className="h-8 w-40 bg-brand-accent/8 rounded" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <div className="h-12 w-28 bg-brand-accent/6 rounded-xl animate-pulse" />
        <div className="h-12 flex-1 bg-brand-primary/15 rounded-xl animate-pulse" />
      </div>
      <div className="flex items-center justify-center pt-4 gap-2">
        <Loader2 className="w-4 h-4 text-brand-primary/40 animate-spin" />
        <p className="text-xs text-brand-secondary/40">Cargando...</p>
      </div>
    </div>
  );
}

function ErrorViewPago({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 ring-8 ring-red-50/50">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm text-brand-secondary/80 max-w-sm leading-relaxed">
        {message}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 px-5 py-2.5 text-sm font-medium text-brand-secondary/60 hover:text-brand-text border border-brand-accent/15 rounded-xl hover:border-brand-accent/30 transition-all cursor-pointer">
        Volver
      </button>
    </div>
  );
}

function CheckoutActionsFooterPago({
  isComplete,
  submitting,
  onBack,
  onConfirm,
}: {
  isComplete: boolean;
  submitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 pt-1"
      id="continue-button-container">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-3 text-sm font-medium text-brand-secondary/50 hover:text-brand-text border border-brand-accent/15 rounded-xl hover:border-brand-accent/30 transition-all cursor-pointer">
        Volver
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!isComplete || submitting}
        className="flex-1 px-5 py-3 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 active:scale-[0.98] transition-all disabled:bg-brand-accent/30 disabled:text-white/40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer">
        {submitting ? "Verificando..." : "Confirmar pago"}
      </button>
    </div>
  );
}
