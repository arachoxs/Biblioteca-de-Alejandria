"use client";

import { Smartphone } from "lucide-react";

export default function ARButton() {
  return (
    <div className="mb-8 relative inline-block group">
      <button
        disabled
        className="w-full sm:w-auto bg-transparent border border-brand-accent/30 text-brand-secondary/50 py-4 px-8 rounded-sm flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-sm cursor-not-allowed opacity-50"
      >
        <Smartphone className="w-5 h-5" />
        Ver en realidad aumentada
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-brand-text text-white text-xs rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        Funcionalidad en desarrollo
      </div>
    </div>
  );
}