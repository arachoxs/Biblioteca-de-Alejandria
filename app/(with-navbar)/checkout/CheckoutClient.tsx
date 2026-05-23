"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, BookOpen, ChevronUp } from "lucide-react";
import {
  getCartAction,
  cancelCartItemAction,
  addCartBookAction,
  cancelBookReservasAction,
} from "../cartActions";
import type { ReservaAgrupadaItem } from "@/lib/types/reserva";
import { MAX_RESERVAS_MISMO_LIBRO } from "@/lib/types/reserva";
import Alert from "@/components/ui/Alert";

type CartStatus = "loading" | "loaded" | "error";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CheckoutClient() {
  const [status, setStatus] = useState<CartStatus>("loading");
  const [cartData, setCartData] = useState<ReservaAgrupadaItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mutingBooks, setMutingBooks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "error"; message: string } | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [sheetClosing, setSheetClosing] = useState(false);

  const openSummary = useCallback(() => setSummaryExpanded(true), []);

  const closeSummary = useCallback(() => {
    setSheetClosing(true);
    setTimeout(() => {
      setSheetClosing(false);
      setSummaryExpanded(false);
    }, 250);
  }, []);

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
    fetchCart();
  }, [fetchCart]);

  async function handleIncrement(id_libro: string) {
    setCartData(
      (prev) =>
        prev?.map((g) =>
          g.id_libro === id_libro
            ? { ...g, copias_reservadas: g.copias_reservadas + 1 }
            : g,
        ) ?? prev,
    );
    setMutingBooks((prev) => new Set(prev).add(id_libro));
    try {
      const result = await addCartBookAction(id_libro);
      if (!result.success) {
        await fetchCart();
        setToast({ type: "error", message: result.message ?? "No se pudo agregar una copia." });
      }
    } catch {
      await fetchCart();
      setToast({ type: "error", message: "Error inesperado." });
    } finally {
      setMutingBooks((prev) => {
        const next = new Set(prev);
        next.delete(id_libro);
        return next;
      });
    }
  }

  async function handleDecrement(group: ReservaAgrupadaItem) {
    const targetId = group.reservas[group.reservas.length - 1]?.id_reserva;
    if (!targetId) return;

    setCartData(
      (prev) =>
        prev
          ?.map((g) =>
            g.id_libro === group.id_libro
              ? {
                  ...g,
                  copias_reservadas: g.copias_reservadas - 1,
                  reservas: g.reservas.slice(0, -1),
                }
              : g,
          )
          ?.filter((g) => g.copias_reservadas > 0) ?? prev,
    );

    setMutingBooks((prev) => new Set(prev).add(group.id_libro));
    try {
      const result = await cancelCartItemAction(targetId);
      if (!result.success) {
        await fetchCart();
        setToast({ type: "error", message: result.message ?? "No se pudo quitar la copia." });
      }
    } catch {
      await fetchCart();
      setToast({ type: "error", message: "Error inesperado." });
    } finally {
      setMutingBooks((prev) => {
        const next = new Set(prev);
        next.delete(group.id_libro);
        return next;
      });
    }
  }

  async function handleRemoveBook(group: ReservaAgrupadaItem) {
    const ids = group.reservas.map((r) => r.id_reserva);
    if (ids.length === 0) return;

    setCartData((prev) => prev?.filter((g) => g.id_libro !== group.id_libro) ?? prev);

    setMutingBooks((prev) => new Set(prev).add(group.id_libro));
    try {
      const result = await cancelBookReservasAction(ids);
      if (!result.success) {
        await fetchCart();
        setToast({ type: "error", message: result.message ?? "No se pudieron eliminar los libros." });
      }
    } catch {
      await fetchCart();
      setToast({ type: "error", message: "Error inesperado." });
    } finally {
      setMutingBooks((prev) => {
        const next = new Set(prev);
        next.delete(group.id_libro);
        return next;
      });
    }
  }

  const total =
    cartData?.reduce(
      (sum, item) => sum + item.precio * item.copias_reservadas,
      0,
    ) ?? 0;

  const itemCount = cartData?.reduce((s, g) => s + g.copias_reservadas, 0) ?? 0;

  // ── Loading skeleton ──
  if (status === "loading") {
    return (
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 max-lg:pb-24">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-brand-accent/15 p-5 flex gap-5"
            >
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

  // ── Error state ──
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <X className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-brand-secondary mb-4">
          {errorMsg ?? "Error al cargar el carrito."}
        </p>
        <button
          type="button"
          onClick={fetchCart}
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primary/90 transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!cartData || cartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-accent/20 flex items-center justify-center mb-5">
          <BookOpen className="w-7 h-7 text-brand-accent" />
        </div>
        <h2 className="font-display text-xl font-semibold text-brand-text mb-2">
          No tienes libros reservados
        </h2>
        <p className="text-brand-secondary text-sm mb-6 max-w-sm leading-relaxed">
          Agrega libros a tu carrito desde el catálogo para iniciar el proceso
          de compra.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  // ── Main content ──
  return (
    <>
      {toast && (
        <Alert variant={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Alert>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 max-lg:pb-24">
        {/* ── Left: Product list ── */}
        <div className="space-y-4">
          {(cartData ?? []).map((group, index) => {
            const isMuting = mutingBooks.has(group.id_libro);
            const lineTotal = group.precio * group.copias_reservadas;

            return (
              <div
                key={group.id_libro}
                className={`checkout-fade-in bg-white rounded-xl border border-brand-accent/15 p-4 lg:p-5 transition-all duration-200 relative overflow-hidden ${
                  isMuting
                    ? "opacity-50 scale-[0.98]"
                    : "hover:border-brand-accent/30 hover:shadow-sm"
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex gap-4 lg:gap-5">
                  {/* Cover image */}
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

                  {/* Info */}
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
                        onClick={() => handleRemoveBook(group)}
                        disabled={isMuting}
                        className="shrink-0 p-1.5 rounded-lg text-brand-secondary/25 hover:text-red-500 hover:bg-red-50/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Eliminar este libro"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-medium text-brand-primary/80 mt-2">
                      {formatPrice(group.precio)} <span className="text-brand-secondary/50 text-xs font-normal">c/u</span>
                    </p>

                    {/* Quantity controls + line total */}
                    <div className="flex items-center justify-between mt-3 lg:mt-4">
                      <div className="flex items-center gap-0">
                        <button
                          type="button"
                          onClick={() => handleDecrement(group)}
                          disabled={isMuting || group.copias_reservadas <= 1}
                          className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-l-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="h-8 lg:h-9 px-3 lg:px-4 flex items-center justify-center border-t border-b border-brand-accent/20 bg-white min-w-[4rem] lg:min-w-[5rem]">
                          <span className="text-sm font-medium text-brand-text tabular-nums">
                            {group.copias_reservadas}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIncrement(group.id_libro)}
                          disabled={
                            isMuting ||
                            group.copias_reservadas >= MAX_RESERVAS_MISMO_LIBRO
                          }
                          className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-r-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          aria-label="Aumentar cantidad"
                        >
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
          })}
        </div>

        {/* ── Right: Summary panel (desktop) ── */}
        <div className="hidden lg:block checkout-summary-in">
          <div className="bg-brand-text rounded-xl overflow-hidden sticky top-24 shadow-xl shadow-brand-text/20">
            <div className="px-5 lg:px-6 py-5 border-b border-white/8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white tracking-tight">
                  Resumen
                </h2>
                <span className="text-xs font-medium text-brand-accent/70 bg-white/5 px-2.5 py-1 rounded-full">
                  {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                </span>
              </div>
            </div>

            <div className="px-5 lg:px-6 py-4 space-y-3 border-b border-white/8">
              {cartData.map((group) => (
                <div key={group.id_libro} className="flex items-center justify-between gap-3">
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
              ))}
            </div>

            <div className="px-5 lg:px-6 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-accent/70">Subtotal</span>
                <span className="text-sm text-white font-medium tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="border-t border-white/8 my-2" />
              <div className="flex items-end justify-between">
                <span className="text-sm text-brand-accent/70">Total</span>
                <span className="font-display text-xl lg:text-2xl font-bold text-white tabular-nums leading-none">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="px-5 lg:px-6 pb-6 pt-2">
              <button
                type="button"
                disabled
                className="w-full py-3.5 px-4 bg-white/10 text-white/40 text-sm font-medium rounded-xl border border-white/8 cursor-not-allowed transition-all"
              >
                Continuar
              </button>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <svg className="w-3.5 h-3.5 stroke-brand-accent/40 shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-xs text-brand-accent/40 text-center leading-relaxed">
                  Próximamente podrás seleccionar el método de entrega y pago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: Peek bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-brand-text border-t border-white/8 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1" onClick={openSummary}>
              <div className="flex items-center gap-1.5 shrink-0">
                <BookOpen className="w-4 h-4 text-brand-accent" />
                <span className="text-sm text-brand-accent font-medium tabular-nums">{itemCount}</span>
              </div>

              <span className="text-xs text-brand-accent/40 hidden sm:inline mx-0.5">·</span>

              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-xs text-brand-accent/50 leading-none shrink-0 hidden sm:inline">Total</span>
                <span className="font-display text-base font-bold text-white tabular-nums truncate">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-all cursor-pointer whitespace-nowrap"
              >
                Ver detalle
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                disabled
                className="px-3.5 py-1.5 bg-white/10 text-white/40 text-xs font-medium rounded-lg border border-white/8 cursor-not-allowed shrink-0 whitespace-nowrap"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: Bottom sheet ── */}
      {(summaryExpanded || sheetClosing) && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-brand-text/40 backdrop-blur-sm ${
              sheetClosing ? "sheet-backdrop-out" : "sheet-backdrop-in"
            }`}
            onClick={closeSummary}
          />
          <div
            className={`absolute bottom-0 left-0 right-0 bg-brand-text rounded-t-2xl shadow-xl shadow-brand-text/30 max-h-[75dvh] flex flex-col ${
              sheetClosing ? "sheet-slide-out" : "sheet-slide-in"
            }`}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <h2 className="font-display text-lg font-semibold text-white">
                Resumen
              </h2>
              <button
                type="button"
                onClick={closeSummary}
                className="w-8 h-8 flex items-center justify-center rounded-full text-brand-accent/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="py-3 space-y-3 border-t border-white/8">
                {cartData.map((group) => (
                  <div key={group.id_libro} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/80 truncate leading-tight">{group.titulo}</p>
                      <span className="text-xs text-brand-accent/50">{group.copias_reservadas}× {formatPrice(group.precio)}</span>
                    </div>
                    <span className="text-sm font-medium text-white tabular-nums shrink-0">{formatPrice(group.precio * group.copias_reservadas)}</span>
                  </div>
                ))}
              </div>

              <div className="py-4 space-y-2.5 border-t border-white/8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-accent/70">Subtotal</span>
                  <span className="text-sm font-medium text-white tabular-nums">{formatPrice(total)}</span>
                </div>
                <div className="border-t border-white/8 my-2" />
                <div className="flex items-end justify-between">
                  <span className="text-sm text-brand-accent/70">Total</span>
                  <span className="font-display text-xl font-bold text-white tabular-nums">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 bg-white/10 text-white/40 text-sm font-medium rounded-xl border border-white/8 cursor-not-allowed"
                >
                  Continuar
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <svg className="w-3.5 h-3.5 stroke-brand-accent/40 shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p className="text-xs text-brand-accent/40 text-center leading-relaxed">
                    Próximamente podrás seleccionar el método de entrega y pago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
