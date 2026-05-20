"use client";

import { ShoppingCart } from "lucide-react";

interface QuantityControlsProps {
  quantity: number;
  increment: () => void;
  decrement: () => void;
  isCartAvailable: boolean;
  cartTooltip: string;
  stockDisponible: number | null | undefined;
}

export default function QuantityControls({
  quantity,
  increment,
  decrement,
  isCartAvailable,
  cartTooltip,
  stockDisponible,
}: QuantityControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex items-center gap-0 rounded-sm border border-brand-accent/30 overflow-hidden">
        <button
          onClick={decrement}
          disabled={quantity <= 1}
          className="px-4 py-3 text-brand-secondary hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Decrease quantity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <span className="flex-1 text-center font-semibold text-brand-text">
          {quantity}
        </span>
        <button
          onClick={increment}
          disabled={quantity >= 3}
          className="px-4 py-3 text-brand-secondary hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Increase quantity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <button
        disabled={!isCartAvailable}
        title={cartTooltip}
        className="flex-1 bg-brand-primary text-white py-4 px-8 rounded-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-sm disabled:bg-brand-accent/30 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="w-5 h-5" />
        Agregar al carrito
      </button>
      {stockDisponible !== undefined && stockDisponible !== null && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-sm border border-brand-accent/20">
          <span className="text-xs text-brand-secondary">Stock:</span>
          <span className="text-sm font-semibold text-brand-text">
            {stockDisponible} unidades
          </span>
        </div>
      )}
    </div>
  );
}