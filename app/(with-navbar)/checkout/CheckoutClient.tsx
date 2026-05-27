"use client";

import React, { useState, useEffect, useCallback, startTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  BookOpen,
  ChevronUp,
  Check,
} from "lucide-react";
import Alert from "@/components/ui/Alert";
import { getCartAction } from "../cartActions";
import type { ReservaAgrupadaItem } from "@/lib/types/reserva";
import { MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import type {
  OpcionEnvio,
  TarjetaPaymentAllocation,
} from "@/lib/types/checkout";
import EnvioStep from "./EnvioStep";
import PagoStep from "./PagoStep";
import ConfirmacionStep from "./ConfirmacionStep";
import {
  useCheckoutState,
  useCartSummary,
  useSummarySheet,
} from "@/hooks/useCheckout";
import type { Step } from "@/hooks/useCheckout";
import { useCartMutations } from "@/hooks/useCartMutations";

type CartStatus = "loading" | "loaded" | "error";

type StepKey = "carrito" | "envio" | "pago" | "confirmacion";

interface StepConfig {
  number: number;
  label: string;
  completed: (current: Step, initial?: Step) => boolean;
  backTo: StepKey | null;
}

const STEP_CONFIG: Record<StepKey, StepConfig> = {
  carrito: {
    number: 1,
    label: "Carrito",
    completed: (current) => current !== "carrito",
    backTo: null,
  },
  envio: {
    number: 2,
    label: "Envío",
    completed: (current) => current === "pago" || current === "confirmacion",
    backTo: "carrito",
  },
  pago: {
    number: 3,
    label: "Pago",
    completed: (current) => current === "confirmacion",
    backTo: "envio",
  },
  confirmacion: {
    number: 4,
    label: "Confirmar",
    completed: () => false,
    backTo: "pago",
  },
} as const;

// ── Formatter ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

interface PriceSummaryProps {
  total: number;
  costoEnvio: number;
  envioOpcion: OpcionEnvio | null;
  itemCount: number;
  variant: "desktop" | "mobile";
}

function PriceSummary({
  total,
  costoEnvio,
  envioOpcion,
  itemCount,
  variant,
}: PriceSummaryProps) {
  const totalConEnvio = total + costoEnvio;

  return (
    <>
      {variant === "desktop" && (
        <div className="px-5 lg:px-6 py-4 space-y-3 border-b border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-brand-accent/70 bg-white/5 px-2.5 py-1 rounded-full">
              {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
            </span>
          </div>
        </div>
      )}

      <div className="px-5 lg:px-6 py-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-accent/70">Subtotal</span>
          <span className="text-sm text-white font-medium tabular-nums">
            {formatPrice(total)}
          </span>
        </div>

        {envioOpcion && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-accent/70">Envío</span>
            <span
              className={`text-sm font-medium tabular-nums ${envioOpcion.costo > 0 ? "text-brand-accent" : "text-success"}`}>
              {envioOpcion.costo > 0
                ? formatPrice(envioOpcion.costo)
                : "Gratis"}
            </span>
          </div>
        )}

        <div className="border-t border-white/8 my-2" />
        <div className="flex items-end justify-between">
          <span className="text-sm text-brand-accent/70">Total</span>
          <span className="font-display text-xl lg:text-2xl font-bold text-white tabular-nums leading-none">
            {formatPrice(totalConEnvio)}
          </span>
        </div>
      </div>
    </>
  );
}

interface CartItemRowProps {
  group: ReservaAgrupadaItem;
}

function CartItemRow({ group }: CartItemRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/80 truncate leading-tight">
          {group.titulo}
        </p>
        <span className="text-xs text-brand-accent/50">
          {group.copias_reservadas}× {formatPrice(group.precio)}
        </span>
      </div>
      <span className="text-sm font-medium text-white tabular-nums shrink-0">
        {formatPrice(group.precio * group.copias_reservadas)}
      </span>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepCircle({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  const circleClass = completed
    ? "bg-brand-accent text-white scale-100"
    : active
      ? "bg-brand-primary text-white scale-110 ring-4 ring-brand-primary/15"
      : "bg-white text-brand-secondary/40 border-2 border-brand-accent/15 scale-100";

  const textClass = active
    ? "text-brand-text font-semibold"
    : completed
      ? "text-brand-accent"
      : "text-brand-secondary/40";

  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10 w-12 lg:w-16">
      <div
        className={`relative flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${circleClass}`}>
        {completed ? (
          <Check className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <span className="font-display text-sm font-semibold">{number}</span>
        )}
        {active && (
          <span className="absolute inset-0 rounded-full animate-ping bg-brand-primary/20" />
        )}
      </div>
      <span
        className={`text-[10px] font-medium uppercase tracking-wider transition-colors duration-300 whitespace-nowrap text-center hidden lg:inline ${textClass}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div className="flex-1 min-w-[1rem] lg:min-w-[4rem] relative lg:-mx-8 z-0 self-start mt-4 h-px bg-brand-accent/10">
      <div
        className={`absolute inset-y-0 left-0 h-full rounded-full transition-all duration-500 ${completed ? "w-full bg-brand-accent/50" : "w-0"}`}
      />
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 max-lg:pb-24">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-brand-accent/15 p-5 flex gap-5">
            <div className="w-[72px] aspect-[3/4] shrink-0 bg-brand-accent/8 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2.5">
              <div className="h-5 w-3/4 bg-brand-accent/12 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-brand-accent/8 rounded animate-pulse" />
              <div className="h-4 w-1/4 bg-brand-accent/8 rounded animate-pulse" />
              <div className="h-9 w-40 bg-brand-accent/8 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden lg:block">
        <div className="bg-brand-text rounded-xl overflow-hidden sticky top-24">
          <div className="p-5 space-y-3">
            <div className="h-5 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/8 rounded animate-pulse" />
            <div className="h-4 w-28 bg-white/8 rounded animate-pulse" />
            <div className="h-10 w-full bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="w-16 h-16 rounded-full bg-brand-text/5 flex items-center justify-center mb-5">
        <X className="w-7 h-7 text-danger" />
      </div>
      <p className="text-brand-secondary mb-4">
        {message ?? "Error al cargar el carrito."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primary/90 transition-colors cursor-pointer">
        Reintentar
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
      <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-accent/20 flex items-center justify-center mb-5">
        <BookOpen className="w-7 h-7 text-brand-accent" />
      </div>
      <h2 className="font-display text-xl font-semibold text-brand-text mb-2">
        No tienes libros reservados
      </h2>
      <p className="text-brand-secondary text-sm mb-6 max-w-sm leading-relaxed">
        Agrega libros a tu carrito desde el catálogo para iniciar el proceso de
        compra.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primary/90 transition-colors">
        Explorar catálogo
      </Link>
    </div>
  );
}

// ── Cart item card ─────────────────────────────────────────────────────────────

interface CartItemCardProps {
  group: ReservaAgrupadaItem;
  isMuting: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  index: number;
}

function CartItemCard({
  group,
  isMuting,
  onIncrement,
  onDecrement,
  onRemove,
  index,
}: CartItemCardProps) {
  const lineTotal = group.precio * group.copias_reservadas;
  const isDecrementDisabled = isMuting || group.copias_reservadas <= 1;
  const isIncrementDisabled =
    isMuting || group.copias_reservadas >= MAX_RESERVAS_MISMO_LIBRO;

  return (
    <div
      className={`checkout-fade-in bg-white rounded-xl border border-brand-accent/15 p-4 lg:p-5 transition-all duration-200 relative overflow-hidden ${
        isMuting
          ? "opacity-50 scale-[0.98]"
          : "hover:border-brand-accent/30 hover:shadow-sm"
      }`}
      style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex gap-4 lg:gap-5">
        <div className="w-[64px] lg:w-[80px] aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-brand-bg shadow-sm shadow-brand-accent/10 ring-1 ring-black/5">
          {group.imagen ? (
            <Image
              src={group.imagen}
              alt={group.titulo}
              width={80}
              height={107}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-primary/8 to-brand-accent/12 flex items-center justify-center">
              <span className="font-display text-lg font-bold text-brand-accent/40 select-none">
                {group.titulo.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base lg:text-lg font-semibold text-brand-text leading-tight truncate">
                {group.titulo}
              </h3>
              {group.autor_nombre && (
                <p className="text-sm text-brand-secondary/70 mt-0.5">
                  {group.autor_nombre}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              disabled={isMuting}
              className="shrink-0 p-1.5 rounded-lg text-brand-secondary/25 hover:text-danger hover:bg-danger/10 hover:cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Eliminar este libro">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-medium text-brand-primary/80 mt-2">
            {formatPrice(group.precio)}{" "}
            <span className="text-brand-secondary/50 text-xs font-normal">
              c/u
            </span>
          </p>

          <div className="flex items-center justify-between mt-3 lg:mt-4">
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={onDecrement}
                disabled={isDecrementDisabled}
                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-l-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Disminuir cantidad">
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="h-8 lg:h-9 px-3 lg:px-4 flex items-center justify-center border-t border-b border-brand-accent/20 bg-white min-w-[4rem] lg:min-w-[5rem]">
                <span className="text-sm font-medium text-brand-text tabular-nums">
                  {group.copias_reservadas}
                </span>
              </div>

              <button
                type="button"
                onClick={onIncrement}
                disabled={isIncrementDisabled}
                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-r-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Aumentar cantidad">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <span className="font-display text-base lg:text-lg font-semibold text-brand-text tabular-nums">
              {formatPrice(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CheckoutClient() {
  const [status, setStatus] = useState<CartStatus>("loading");
  const [cartData, setCartData] = useState<ReservaAgrupadaItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentAllocations, setPaymentAllocations] = useState<
    TarjetaPaymentAllocation[]
  >([]);

  const {
    currentStep,
    envioOpcion,
    idTiendaDestino,
    purchaseComplete,
    setPurchaseComplete,
    goToEnvio,
    goToCarrito,
    goToPago,
    goToConfirmacion,
  } = useCheckoutState();
  const { summaryExpanded, sheetClosing, openSummary, closeSummary } =
    useSummarySheet();
  const { total, costoEnvio, totalConEnvio, itemCount } = useCartSummary(
    cartData,
    envioOpcion,
  );

  const fetchCart = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const result = await getCartAction();
      if (result.success && result.data) {
        setCartData(result.data);
      } else {
        setCartData([]);
        if (result.message) setErrorMsg(result.message);
      }
    } catch {
      setCartData([]);
      setErrorMsg("Error al cargar los datos del carrito.");
    } finally {
      setStatus("loaded");
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      fetchCart();
    });
  }, [fetchCart]);

  const [showErrorMsg, setShowErrorMsg] = useState<string | null>(null);

  const showError = useCallback((message: string) => {
    setShowErrorMsg(message);
  }, []);

  const { mutingBooks, handleIncrement, handleDecrement, handleRemoveBook } =
    useCartMutations({
      onError: showError,
      onCartRefresh: fetchCart,
    });

  if (status === "loading") return <LoadingSkeleton />;
  if (status === "error")
    return <ErrorState message={errorMsg} onRetry={fetchCart} />;
  if (!cartData || cartData.length === 0) return <EmptyState />;

  return (
    <>
      {showErrorMsg && (
        <Alert variant="error" onClose={() => setShowErrorMsg(null)}>
          {showErrorMsg}
        </Alert>
      )}
      <CheckoutMainContent
        cartData={cartData}
        currentStep={currentStep}
        mutingBooks={mutingBooks}
        envioOpcion={envioOpcion}
        total={total}
        costoEnvio={costoEnvio}
        totalConEnvio={totalConEnvio}
        itemCount={itemCount}
        paymentAllocations={paymentAllocations}
        idTiendaDestino={idTiendaDestino}
        purchaseComplete={purchaseComplete}
        setPaymentAllocations={setPaymentAllocations}
        onGoToEnvio={goToEnvio}
        onGoToCarrito={goToCarrito}
        onGoToPago={goToPago}
        onGoToConfirmacion={goToConfirmacion}
        onPurchaseComplete={() => setPurchaseComplete(true)}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemoveBook}
      />

      <MobilePeekBar
        itemCount={itemCount}
        totalConEnvio={totalConEnvio}
        currentStep={currentStep}
        envioOpcion={envioOpcion}
        onOpenSummary={openSummary}
        onGoToEnvio={goToEnvio}
        onGoToPago={goToPago}
      />

      <MobileSummarySheet
        summaryExpanded={summaryExpanded}
        sheetClosing={sheetClosing}
        currentStep={currentStep}
        cartData={cartData}
        total={total}
        costoEnvio={costoEnvio}
        envioOpcion={envioOpcion}
        itemCount={itemCount}
        onClose={closeSummary}
        onGoToEnvio={goToEnvio}
      />
    </>
  );
}

interface CheckoutStepNavProps {
  currentStep: Step;
  purchaseComplete: boolean;
}

function CheckoutStepNav({
  currentStep,
  purchaseComplete,
}: CheckoutStepNavProps) {
  const stepKeys = Object.keys(STEP_CONFIG) as StepKey[];

  return (
    <div className="flex items-center justify-center mb-7 min-h-[2rem]">
      <div className="flex items-center justify-center gap-0 select-none">
        {stepKeys.map((key, idx) => {
          const cfg = STEP_CONFIG[key];
          const isCompleted = purchaseComplete ? true : cfg.completed(currentStep);
          return (
            <React.Fragment key={key}>
              <StepCircle
                number={cfg.number}
                label={cfg.label}
                active={currentStep === key}
                completed={isCompleted}
              />
              {idx < stepKeys.length - 1 && <StepLine completed={isCompleted} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface CheckoutSidebarProps {
  currentStep: Step;
  envioOpcion: OpcionEnvio | null;
  total: number;
  costoEnvio: number;
  totalConEnvio: number;
  itemCount: number;
  purchaseComplete: boolean;
  onGoToEnvio: () => void;
  onGoToPago: (opcion: OpcionEnvio, idTiendaDestino?: string) => boolean;
}

function SidebarBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs text-success bg-success/5 rounded-lg py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        {label}
      </div>
      <p className="text-white/70 text-xs mt-2">{value}</p>
    </div>
  );
}

function CheckoutSidebar({
  currentStep,
  envioOpcion,
  total,
  costoEnvio,
  totalConEnvio,
  itemCount,
  purchaseComplete,
  onGoToEnvio,
  onGoToPago,
}: CheckoutSidebarProps) {
  const tipoTexto = !envioOpcion
    ? "envío"
    : envioOpcion.tipo === "domicilio"
      ? "Envío a domicilio"
      : envioOpcion.tipo === "traslado"
        ? `Traslado a ${envioOpcion.tiendaNombre}`
        : `Recogida en ${envioOpcion.tiendaNombre}`;

  const stepKey = currentStep;

  const SIDEBAR_CONTENT: Record<StepKey, React.ReactNode> = {
    carrito: (
      <button
        type="button"
        onClick={onGoToEnvio}
        className="w-full py-3.5 px-4 bg-white text-brand-text text-sm font-medium rounded-xl hover:bg-white/90 transition-all cursor-pointer">
        Continuar
      </button>
    ),
    envio: envioOpcion ? (
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-success bg-success/5 rounded-lg py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Método de entrega seleccionado
        </div>
        <p className="text-white/70 text-xs mt-2">{tipoTexto}</p>
        <button
          type="button"
          onClick={() => onGoToPago(envioOpcion)}
          className="w-full mt-3 py-3 px-4 bg-white text-brand-text text-sm font-medium rounded-xl hover:bg-white/90 transition-all cursor-pointer">
          Ir a pago
        </button>
      </div>
    ) : null,
    pago: (
      <SidebarBadge
        label="Pago configurado"
        value={`${formatPrice(totalConEnvio)} · ${envioOpcion?.tipo ?? "envío"}`}
      />
    ),
    confirmacion: (
      <SidebarBadge
        label="Listo para confirmar"
        value={formatPrice(totalConEnvio)}
      />
    ),
  };

  return (
    <div className="hidden lg:block checkout-summary-in">
      <div className="bg-brand-text rounded-xl overflow-hidden sticky top-24 shadow-xl shadow-brand-text/20">
        <div className="px-5 lg:px-6 py-5 border-b border-white/8">
          <h2 className="font-display text-lg font-semibold text-white tracking-tight">
            Resumen
          </h2>
        </div>

        <PriceSummary
          total={total}
          costoEnvio={costoEnvio}
          envioOpcion={envioOpcion}
          itemCount={itemCount}
          variant="desktop"
        />

        <div className="px-5 lg:px-6 pb-6 pt-2">
          {purchaseComplete ? (
            <SidebarBadge label="Pagado exitosamente" value={formatPrice(totalConEnvio)} />
          ) : (
            SIDEBAR_CONTENT[stepKey]
          )}
        </div>
      </div>
    </div>
  );
}

interface CheckoutMainContentProps {
  cartData: ReservaAgrupadaItem[];
  currentStep: Step;
  mutingBooks: Set<string>;
  envioOpcion: OpcionEnvio | null;
  total: number;
  costoEnvio: number;
  totalConEnvio: number;
  itemCount: number;
  paymentAllocations: TarjetaPaymentAllocation[];
  idTiendaDestino: string;
  purchaseComplete: boolean;
  setPaymentAllocations: (allocations: TarjetaPaymentAllocation[]) => void;
  onGoToEnvio: () => void;
  onGoToCarrito: () => void;
  onGoToPago: (opcion: OpcionEnvio, idTiendaOrigen?: string) => boolean;
  onGoToConfirmacion: () => void;
  onPurchaseComplete: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (group: ReservaAgrupadaItem) => void;
  onRemove: (group: ReservaAgrupadaItem) => void;
}

interface StepRenderData {
  step: Step;
  cartData: ReservaAgrupadaItem[];
  mutingBooks: Set<string>;
  envioOpcion: OpcionEnvio | null;
  totalConEnvio: number;
  paymentAllocations: TarjetaPaymentAllocation[];
  idTiendaDestino: string;
}

interface StepRenderActions {
  setPaymentAllocations: (allocations: TarjetaPaymentAllocation[]) => void;
  onGoToPago: (opcion: OpcionEnvio, idTiendaDestino?: string) => boolean;
  onGoToConfirmacion: () => void;
  onGoToCarrito: () => void;
  onGoToEnvio: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (group: ReservaAgrupadaItem) => void;
  onRemove: (group: ReservaAgrupadaItem) => void;
  onPurchaseComplete: () => void;
}

function renderStepContent(
  { step, cartData, mutingBooks, envioOpcion, totalConEnvio, paymentAllocations, idTiendaDestino }: StepRenderData,
  { setPaymentAllocations, onGoToPago, onGoToConfirmacion, onGoToCarrito, onGoToEnvio, onIncrement, onDecrement, onRemove, onPurchaseComplete }: StepRenderActions,
) {
  if (step === "carrito") {
    return cartData.map((group, index) => (
      <CartItemCard
        key={group.id_libro}
        group={group}
        isMuting={mutingBooks.has(group.id_libro)}
        onIncrement={() => onIncrement(group.id_libro)}
        onDecrement={() => onDecrement(group)}
        onRemove={() => onRemove(group)}
        index={index}
      />
    ));
  }

  if (step === "envio") {
    return (
      <EnvioStep
        onConfirm={(opcion, tiendaDestino) => {
          onGoToPago(opcion, tiendaDestino);
        }}
        onBack={onGoToCarrito}
      />
    );
  }

  if (step === "pago") {
    return (
      <PagoStep
        totalAmount={totalConEnvio}
        onConfirm={(allocations) => {
          setPaymentAllocations(allocations);
          onGoToConfirmacion();
        }}
        onBack={onGoToEnvio}
      />
    );
  }

  return (
    <ConfirmacionStep
      envioOpcion={envioOpcion}
      paymentAllocations={paymentAllocations}
      totalConEnvio={totalConEnvio}
      cartData={cartData ?? []}
      idTiendaDestino={idTiendaDestino}
      onBack={() => envioOpcion && onGoToPago(envioOpcion)}
      onPurchaseComplete={onPurchaseComplete}
    />
  );
}

function CheckoutMainContent({
  cartData,
  currentStep,
  mutingBooks,
  envioOpcion,
  total,
  costoEnvio,
  totalConEnvio,
  itemCount,
  paymentAllocations,
  idTiendaDestino,
  purchaseComplete,
  setPaymentAllocations,
  onGoToEnvio,
  onGoToCarrito,
  onGoToPago,
  onGoToConfirmacion,
  onPurchaseComplete,
  onIncrement,
  onDecrement,
  onRemove,
}: CheckoutMainContentProps) {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 max-lg:pb-24">
      <div className="space-y-4" id="checkout-scroll-container">
        <CheckoutStepNav
          currentStep={currentStep}
          purchaseComplete={purchaseComplete}
        />

        <div className="space-y-4">
          {renderStepContent(
            {
              step: currentStep,
              cartData,
              mutingBooks,
              envioOpcion,
              totalConEnvio,
              paymentAllocations,
              idTiendaDestino,
            },
            {
              setPaymentAllocations,
              onGoToPago,
              onGoToConfirmacion,
              onGoToCarrito,
              onGoToEnvio,
              onIncrement,
              onDecrement,
              onRemove,
              onPurchaseComplete,
            },
          )}
        </div>
      </div>

      <CheckoutSidebar
        currentStep={currentStep}
        envioOpcion={envioOpcion}
        total={total}
        costoEnvio={costoEnvio}
        totalConEnvio={totalConEnvio}
        itemCount={itemCount}
        purchaseComplete={purchaseComplete}
        onGoToEnvio={onGoToEnvio}
        onGoToPago={onGoToPago}
      />
    </div>
  );
}

function MobilePeekBar({
  itemCount,
  totalConEnvio,
  currentStep,
  envioOpcion,
  onOpenSummary,
  onGoToEnvio,
  onGoToPago,
}: {
  itemCount: number;
  totalConEnvio: number;
  currentStep: Step;
  envioOpcion: OpcionEnvio | null;
  onOpenSummary: () => void;
  onGoToEnvio: () => void;
  onGoToPago: (opcion: OpcionEnvio, idTiendaDestino?: string) => boolean;
}) {
  const PEEK_BUTTONS: Record<StepKey, React.ReactNode> = {
    carrito: (
      <>
        <button
          type="button"
          onClick={onOpenSummary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap">
          Ver detalle
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onGoToEnvio}
          className="px-3.5 py-1.5 bg-white text-brand-text text-xs font-medium rounded-lg hover:bg-white/90 transition-all shrink-0 whitespace-nowrap cursor-pointer">
          Continuar
        </button>
      </>
    ),
    envio: (
      <button
        type="button"
        onClick={() => envioOpcion && onGoToPago(envioOpcion)}
        className="px-3.5 py-1.5 bg-white text-brand-text text-xs font-medium rounded-lg hover:bg-white/90 transition-all shrink-0 whitespace-nowrap cursor-pointer">
        Continuar
      </button>
    ),
    pago: null,
    confirmacion: null,
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-brand-text border-t border-white/8 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-2.5 min-w-0 flex-1"
            onClick={onOpenSummary}>
            <div className="flex items-center gap-1.5 shrink-0">
              <BookOpen className="w-4 h-4 text-brand-accent" />
              <span className="text-sm text-brand-accent font-medium tabular-nums">
                {itemCount}
              </span>
            </div>
            <span className="text-xs text-brand-accent/40 hidden sm:inline mx-0.5">
              ·
            </span>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-xs text-brand-accent/50 leading-none shrink-0 hidden sm:inline">
                Total
              </span>
              <span className="font-display text-base font-bold text-white tabular-nums truncate">
                {formatPrice(totalConEnvio)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {PEEK_BUTTONS[currentStep]}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSummarySheet({
  summaryExpanded,
  sheetClosing,
  currentStep,
  cartData,
  total,
  costoEnvio,
  envioOpcion,
  itemCount,
  onClose,
  onGoToEnvio,
}: {
  summaryExpanded: boolean;
  sheetClosing: boolean;
  currentStep: Step;
  cartData: ReservaAgrupadaItem[];
  total: number;
  costoEnvio: number;
  envioOpcion: OpcionEnvio | null;
  itemCount: number;
  onClose: () => void;
  onGoToEnvio: () => void;
}) {
  return (
    <>
      {(summaryExpanded || sheetClosing) && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-brand-text/40 backdrop-blur-sm ${sheetClosing ? "sheet-backdrop-out" : "sheet-backdrop-in"}`}
            onClick={onClose}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 bg-brand-text rounded-t-2xl shadow-xl shadow-brand-text/30 max-h-[75dvh] flex flex-col ${sheetClosing ? "sheet-slide-out" : "sheet-slide-in"}`}>
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="font-display text-lg font-semibold text-white">
                Resumen
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-brand-accent/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {currentStep === "carrito" && (
                <div className="py-3 space-y-3 border-t border-white/8">
                  {cartData.map((group) => (
                    <CartItemRow key={group.id_libro} group={group} />
                  ))}
                </div>
              )}

              <div className="py-4 space-y-2.5 border-t border-white/8">
                <PriceSummary
                  total={total}
                  costoEnvio={costoEnvio}
                  envioOpcion={envioOpcion}
                  itemCount={itemCount}
                  variant="mobile"
                />
              </div>

              {currentStep === "carrito" && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToEnvio();
                    }}
                    className="w-full py-3.5 px-4 bg-white text-brand-text text-sm font-medium rounded-xl hover:bg-white/90 transition-all cursor-pointer">
                    Continuar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
