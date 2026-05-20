"use client";

import { ShoppingCart } from "lucide-react";

interface MobileCartBarProps {
  isCartAvailable: boolean;
  cartTooltip: string;
}

export default function MobileCartBar({ isCartAvailable, cartTooltip }: MobileCartBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-brand-accent/20 p-4 pb-6 md:hidden z-50 shadow-lg">
      <button
        disabled={!isCartAvailable}
        title={cartTooltip}
        className="w-full bg-brand-primary text-white py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 disabled:bg-brand-accent/30 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="w-5 h-5" />
        Agregar al carrito
      </button>
    </div>
  );
}