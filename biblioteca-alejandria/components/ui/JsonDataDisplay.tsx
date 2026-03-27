import React from "react";
import type { Json } from "@/lib/types/supabase";

export interface JsonDataDisplayProps {
  /** The JSON object to display */
  data: Json;
  /** Custom formatting map for specific keys */
  keyLabels?: Record<string, string>;
  /** Optional class name to customize the container */
  className?: string;
  /** Text to show when data is empty or invalid */
  emptyStateText?: string;
}

export default function JsonDataDisplay({
  data,
  keyLabels = {},
  className = "",
  emptyStateText = "Sin detalles adicionales",
}: JsonDataDisplayProps) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return <span className={`text-brand-secondary/50 italic text-xs ${className}`}>{emptyStateText}</span>;
  }

  const formatKeyName = (key: string) => {
    if (keyLabels[key]) return keyLabels[key];
    return key.replace(/_/g, " ");
  };

  return (
    <div className={`flex flex-col gap-1.5 min-w-[200px] max-w-[320px] ${className}`}>
      {Object.entries(data).map(([key, value]) => (
        <div
          key={key}
          className="flex border border-brand-accent/20 rounded-md overflow-hidden shadow-sm bg-white transition-all hover:border-brand-accent/40"
        >
          <div className="bg-brand-bg/80 px-2 py-1.5 flex items-center border-r border-brand-accent/20 w-[110px] shrink-0 justify-center">
            <span className="text-[10px] uppercase font-bold text-brand-secondary/80 tracking-wider text-center">
              {formatKeyName(key)}
            </span>
          </div>
          <div
            className="px-2.5 py-1.5 truncate text-xs font-mono font-medium text-brand-primary bg-white w-full flex items-center"
            title={String(value)}
          >
            {String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
