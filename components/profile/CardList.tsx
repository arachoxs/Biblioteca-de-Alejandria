"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { TarjetaListItem } from "@/services/tarjeta/tarjetaService";

// ─── Iconos ────────────────────────────────────────────────────────

const cardIcon = (
  <svg className="w-5 h-5 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <path d="M1 10h22" />
  </svg>
);

const trashIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const plusCircleIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

const emptyCardIcon = (
  <svg className="w-12 h-12 text-brand-accent/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <path d="M1 10h22" />
    <path d="M6 15h4" />
  </svg>
);

const spinnerIcon = (
  <svg className="size-5 animate-spin text-brand-primary" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

// ─── Skeleton ──────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-brand-accent/15 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-accent/10 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-brand-accent/10 rounded w-28" />
          <div className="h-3 bg-brand-accent/10 rounded w-20" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 bg-brand-accent/10 rounded w-16" />
        <div className="h-3 bg-brand-accent/10 rounded w-24" />
      </div>
    </div>
  );
}

// ─── Componente ────────────────────────────────────────────────────

interface CardListProps {
  tarjetas: TarjetaListItem[];
  isLoading: boolean;
  onAddCard: () => void;
  onAddBalance: (tarjeta: TarjetaListItem) => void;
  onDelete: (tarjetaId: number) => Promise<void>;
}

export default function CardList({
  tarjetas,
  isLoading,
  onAddCard,
  onAddBalance,
  onDelete,
}: CardListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // ── Empty state ──

  if (tarjetas.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="w-20 h-20 bg-brand-accent/8 rounded-full flex items-center justify-center mb-4">
          {emptyCardIcon}
        </div>
        <p className="text-sm text-brand-secondary font-medium mb-1">
          No tienes tarjetas registradas
        </p>
        <p className="text-xs text-brand-accent mb-5 max-w-[220px]">
          Agrega una tarjeta para gestionar tu saldo y realizar transacciones.
        </p>
        <Button
          type="button"
          onClick={onAddCard}
          className="flex items-center justify-center gap-2 mt-2 w-auto px-6 py-2.5 mx-auto"
        >
          {plusCircleIcon}
          Agregar tarjeta
        </Button>
      </div>
    );
  }

  // ── Card list ──

  return (
    <div className="space-y-3">
      {tarjetas.map((t) => {
        const isConfirming = confirmDeleteId === t.id;
        const isDeleting = deletingId === t.id;

        return (
          <div
            key={t.id}
            className="rounded-lg border border-brand-accent/20 bg-white p-4 transition-all hover:border-brand-primary/30 hover:shadow-sm"
          >
            {/* Card header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-accent/10 grid place-items-center flex-shrink-0">
                {cardIcon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-primary truncate">
                  •••• •••• •••• {t.ultimos_cuatro_digitos}
                </p>
                <p className="text-xs text-brand-secondary truncate mt-0.5">
                  {t.nombre_titular}
                </p>
              </div>
            </div>

            {/* Card details */}
            <div className="flex items-center justify-between text-xs mb-3 px-0.5">
              <span className="text-brand-accent">
                Exp: {formatExpiry(t.mes_caducidad, t.ano_caducidad)}
              </span>
              <span className="font-semibold text-brand-primary">
                {formatCurrency(t.saldo)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-brand-accent/10">
              <button
                type="button"
                onClick={() => onAddBalance(t)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-brand-primary bg-brand-accent/8 hover:bg-brand-accent/18 transition-colors cursor-pointer"
              >
                {plusCircleIcon}
                Agregar saldo
              </button>

              {isConfirming ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? spinnerIcon : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1.5 rounded-md text-xs text-brand-secondary hover:text-brand-primary hover:bg-brand-accent/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="inline-flex items-center justify-center p-1.5 rounded-md text-brand-secondary/60 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Eliminar tarjeta"
                >
                  {trashIcon}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add card button */}
      <Button
        type="button"
        onClick={onAddCard}
        disabled={tarjetas.length >= 5}
        title={tarjetas.length >= 5 ? "Límite máximo de 5 tarjetas alcanzado" : undefined}
        className="flex items-center justify-center gap-2 mt-4"
      >
        {plusCircleIcon}
        {tarjetas.length >= 5 ? "Límite alcanzado" : "Agregar tarjeta"}
      </Button>
    </div>
  );
}
