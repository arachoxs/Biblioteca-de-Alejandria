"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface FilterActionBarProps {
  placeholder?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  children?: ReactNode;
}

export default function FilterActionBar({
  placeholder = "Buscar...",
  searchTerm,
  onSearchChange,
  children,
}: FilterActionBarProps) {
  return (
    <div className="bg-white p-1 rounded-xl border border-brand-accent/20 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100 fill-mode-both">
      <div className="flex flex-col md:flex-row gap-2 p-3 items-center">
        <div className="relative flex-grow group w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
          <input
            type="text"
            placeholder={placeholder}
            aria-label={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-brand-bg/50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all text-brand-text placeholder:text-brand-secondary/60 hover:bg-brand-bg"
          />
        </div>
        {children && <div className="w-full md:w-auto flex items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}
