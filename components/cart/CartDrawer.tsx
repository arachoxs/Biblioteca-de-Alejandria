"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ShoppingBag, BookOpen, Plus, Minus } from "lucide-react";
import {
  getCartAction,
  cancelCartItemAction,
  addCartBookAction,
  cancelBookReservasAction,
} from "@/app/(with-navbar)/cartActions";
import Alert from "@/components/ui/Alert";
import type { ReservaAgrupadaItem } from "@/lib/types/reserva";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type CartStatus = "idle" | "loading" | "loaded" | "error";

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [status, setStatus] = useState<CartStatus>("idle");
  const [cartData, setCartData] = useState<ReservaAgrupadaItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [mutingBooks, setMutingBooks] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: "error"; message: string } | null>(null);

  const animateClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closing]);

  const fetchCart = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const result = await getCartAction();
      if (result.success && result.data) {
        setCartData(result.data);
        setStatus("loaded");
      } else {
        setCartData([]);
        setStatus("loaded");
        if (result.message) setErrorMsg(result.message);
      }
    } catch {
      setCartData([]);
      setStatus("error");
      setErrorMsg("Error al cargar el carrito.");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchCart();
  }, [isOpen, fetchCart]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") animateClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, animateClose]);

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
        setToast({ type: "error", message: result.message ?? "No se pudo agregar." });
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
        setToast({ type: "error", message: result.message ?? "No se pudo quitar." });
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
        setToast({ type: "error", message: result.message ?? "No se pudo eliminar el libro." });
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

  function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  }

  // ── Render: Loading skeleton ─────────────────────────────────────
  function renderSkeleton(): JSX.Element {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-4 bg-brand-bg rounded-xl">
            <div className="h-4 w-3/4 bg-brand-accent/12 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-brand-accent/8 rounded animate-pulse" />
            <div className="h-8 w-2/3 bg-brand-accent/8 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // ── Render: Empty state ──────────────────────────────────────────
  function renderEmpty(): JSX.Element {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-accent/20 flex items-center justify-center mb-5">
          <BookOpen className="w-7 h-7 text-brand-accent" />
        </div>
        <p className="font-display text-lg font-semibold text-brand-text mb-2">
          Tu carrito está vacío
        </p>
        <p className="text-sm text-brand-secondary mb-6 leading-relaxed">
          Explora nuestra colección y agrega libros para reservarlos.
        </p>
        <Link
          href="/"
          onClick={animateClose}
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          Explorar libros
        </Link>
      </div>
    );
  }

  // ── Render: Error state ──────────────────────────────────────────
  function renderError(): JSX.Element {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-sm text-brand-secondary mb-4">{errorMsg}</p>
        <button
          type="button"
          onClick={fetchCart}
          className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition-colors cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ── Render: Cart items ───────────────────────────────────────────
  function renderItems(): JSX.Element {
    if (!cartData || cartData.length === 0) return renderEmpty();

    return (
      <div className="space-y-2.5">
        {cartData.map((group) => {
          const isMuting = mutingBooks.has(group.id_libro);

          return (
            <div
              key={group.id_libro}
              className={`bg-brand-bg rounded-xl p-4 border border-brand-accent/15 transition-all duration-200 ${
                isMuting ? "opacity-50 scale-[0.97]" : ""
              }`}
            >
              {/* Header row: title + remove-all button */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-brand-text leading-tight">
                    {group.titulo}
                  </h3>
                  {group.autor_nombre && (
                    <p className="text-xs text-brand-secondary/80 mt-0.5">
                      {group.autor_nombre}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBook(group)}
                  disabled={isMuting}
                  className="shrink-0 p-1 rounded-md text-brand-secondary/30 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Eliminar todas las copias de este libro"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Price per unit */}
              <p className="text-xs font-medium text-brand-primary mt-1.5 mb-3">
                {formatPrice(group.precio)} c/u
              </p>

              {/* Quantity controls */}
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => handleDecrement(group)}
                  disabled={isMuting}
                  className="w-8 h-8 flex items-center justify-center rounded-l-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="h-8 px-4 flex items-center justify-center border-t border-b border-brand-accent/20 bg-white min-w-[5rem]">
                  <span className="text-sm font-medium text-brand-text tabular-nums">
                    {group.copias_reservadas}{" "}
                    <span className="text-xs text-brand-secondary font-normal">
                      {group.copias_reservadas === 1 ? "copia" : "copias"}
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleIncrement(group.id_libro)}
                  disabled={isMuting}
                  className="w-8 h-8 flex items-center justify-center rounded-r-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Body content ────────────────────────────────────────────────
  function renderBody(): JSX.Element {
    if (status === "loading") return renderSkeleton();
    if (status === "error") return renderError();
    return renderItems();
  }

  // ── Dont render on server ───────────────────────────────────────
  if (typeof document === "undefined") return null;

  if (!isOpen && !closing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-brand-text/40 backdrop-blur-sm ${
          closing ? "opacity-0 transition-opacity duration-200" : "cart-backdrop-in"
        }`}
        onClick={animateClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative ml-auto w-full max-w-md h-full bg-white shadow-2xl flex flex-col ${
          closing ? "cart-slide-out" : "cart-slide-in"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-accent/10">
          <h2 className="font-display text-lg font-semibold text-brand-text flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-primary" />
            Carrito
            {cartData && cartData.length > 0 && (
              <span className="text-sm font-sans font-normal text-brand-secondary">
                ({cartData.reduce((s, g) => s + g.copias_reservadas, 0)})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={animateClose}
            className="p-1.5 rounded-full text-brand-secondary/60 hover:text-brand-primary hover:bg-brand-bg transition-all cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{renderBody()}</div>

        {/* Footer */}
        {status === "loaded" && cartData && cartData.length > 0 && (
          <div className="border-t border-brand-accent/10 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-secondary font-medium">Total</span>
              <span className="text-lg font-bold text-brand-primary font-display">
                {formatPrice(total)}
              </span>
            </div>
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 bg-brand-primary/80 text-white text-sm font-medium rounded-lg opacity-60 cursor-not-allowed"
            >
              Proceder al checkout
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Alert variant={toast.type} onClose={() => setToast(null)}>
          {toast.message}
        </Alert>
      )}
    </div>,
    document.body,
  );
}
