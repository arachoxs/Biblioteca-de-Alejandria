"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ShoppingBag, BookOpen } from "lucide-react";
import { getCartAction, cancelCartItemAction } from "@/app/(with-navbar)/cartActions";
import Alert from "@/components/ui/Alert";
import type { ReservaAgrupadaItem } from "@/lib/types/reserva";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function getTimeRemaining(expiration: string): string {
  const diff = new Date(expiration).getTime() - Date.now();
  if (diff <= 0) return "Expirado";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  if (minutes > 0) return `${minutes}m restantes`;
  return "Expirando...";
}

type CartStatus = "idle" | "loading" | "loaded" | "error";

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [status, setStatus] = useState<CartStatus>("idle");
  const [cartData, setCartData] = useState<ReservaAgrupadaItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (!isOpen) return;
    setStatus("loading");
    setErrorMsg(null);

    getCartAction()
      .then((result) => {
        if (result.success && result.data) {
          setCartData(result.data);
          setStatus(result.data.length > 0 ? "loaded" : "loaded");
        } else {
          setCartData([]);
          setStatus("loaded");
          if (result.message) setErrorMsg(result.message);
        }
      })
      .catch(() => {
        setCartData([]);
        setStatus("error");
        setErrorMsg("Error al cargar el carrito.");
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") animateClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, animateClose]);

  async function handleCancel(reservaId: string) {
    setRemovingIds((prev) => new Set(prev).add(reservaId));
    try {
      const result = await cancelCartItemAction(reservaId);
      if (result.success) {
        setCartData((prev) => {
          if (!prev) return prev;
          const updated = prev
            .map((group) => ({
              ...group,
              reservas: group.reservas.filter((r) => r.id_reserva !== reservaId),
            }))
            .filter((group) => group.reservas.length > 0);
          return updated;
        });
      } else {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(reservaId);
          return next;
        });
        setToast({ type: "error", message: result.message ?? "No se pudo cancelar." });
      }
    } catch {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(reservaId);
        return next;
      });
      setToast({ type: "error", message: "Error inesperado al cancelar." });
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
          <div key={i} className="space-y-2">
            <div className="h-4 w-3/4 bg-brand-accent/10 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-brand-accent/8 rounded animate-pulse" />
            <div className="h-3 w-full bg-brand-accent/8 rounded animate-pulse" />
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
          Explora nuestra colección y agrega libros a tu carrito para reservarlos.
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
          onClick={() => {
            setStatus("loading");
            getCartAction()
              .then((result) => {
                if (result.success && result.data) {
                  setCartData(result.data);
                  setStatus("loaded");
                } else {
                  setCartData([]);
                  setStatus("loaded");
                }
              })
              .catch(() => {
                setStatus("error");
              });
          }}
          className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 rounded-lg hover:bg-brand-primary/20 transition-colors"
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
      <div className="space-y-3">
        {cartData.map((group) => (
          <div
            key={group.id_libro}
            className="bg-brand-bg rounded-xl p-4 border border-brand-accent/15"
          >
            <h3 className="font-display text-base font-semibold text-brand-text leading-tight">
              {group.titulo}
            </h3>
            {group.autor_nombre && (
              <p className="text-xs text-brand-secondary/80 mt-0.5">
                {group.autor_nombre}
              </p>
            )}
            <p className="text-xs font-medium text-brand-primary mt-1.5 mb-3">
              {group.copias_reservadas} copias · {formatPrice(group.precio)} c/u
            </p>

            <div className="space-y-1.5">
              {group.reservas.map((r) => {
                const isRemoving = removingIds.has(r.id_reserva);
                return (
                  <div
                    key={r.id_reserva}
                    className={`flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-white border border-brand-accent/10 transition-all duration-200 ${
                      isRemoving ? "opacity-30 scale-95" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono font-medium text-brand-secondary/70 shrink-0">
                        {r.codigo_seq ?? "—"}
                      </span>
                      <span className="text-[11px] text-brand-secondary/60 whitespace-nowrap">
                        {getTimeRemaining(r.fecha_expiracion)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCancel(r.id_reserva)}
                      disabled={isRemoving}
                      className="shrink-0 p-1 rounded-md text-brand-secondary/40 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Cancelar reserva"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
