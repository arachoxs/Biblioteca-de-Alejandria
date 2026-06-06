"use client";

import { Smartphone } from "lucide-react";

interface ARButtonProps {
  libroId: string;
}

export default function ARButton({ libroId }: ARButtonProps) {
  return (
    <div className="mb-8 relative inline-block group">
      <a
        href={`/libro/${libroId}/ar`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto bg-transparent border border-brand-accent/30 text-brand-secondary hover:text-brand-primary hover:border-brand-primary/50 py-4 px-8 rounded-sm flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-sm transition-all duration-300"
      >
        <Smartphone className="w-5 h-5" />
        Ver en realidad aumentada
      </a>
    </div>
  );
}
