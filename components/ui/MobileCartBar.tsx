"use client";

import { ShoppingCart, Loader2 } from "lucide-react";

interface MobileCartBarProps {
  isCartAvailable: boolean;
  cartTooltip: string;
  onAddToCart: () => void;
  isAdding: boolean;
}

export default function MobileCartBar({ isCartAvailable, cartTooltip, onAddToCart, isAdding }: MobileCartBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-brand-accent/20 p-4 pb-6 md:hidden z-50 shadow-lg">
      <button
        disabled={!isCartAvailable || isAdding}
        title={isAdding ? "Agregando..." : cartTooltip}
        onClick={onAddToCart}
        className="w-full bg-brand-primary text-white py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 disabled:bg-brand-accent/30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
      >
        {isAdding ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Agregando…
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Agregar al carrito
          </>
        )}
      </button>
    </div>
  );
}