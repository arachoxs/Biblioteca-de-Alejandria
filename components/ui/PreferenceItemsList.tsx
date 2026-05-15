"use client";

import { TagChip } from "@/components/ui/TagChip";

interface PreferenceItem {
  id: number;
  nombre: string;
}

interface PreferenceItemsListProps {
  isLoading: boolean;
  items: PreferenceItem[];
  filteredItems: PreferenceItem[];
  selectedIds: number[];
  titleKey: string;
  onToggle: (id: number) => void;
}

export default function PreferenceItemsList({
  isLoading,
  items,
  filteredItems,
  selectedIds,
  titleKey,
  onToggle,
}: PreferenceItemsListProps) {
  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center w-full">
        <div className="w-5 h-5 border-2 border-brand-accent/30 border-t-brand-primary rounded-full animate-spin" />
        <span className="ml-2 text-sm text-brand-secondary">Cargando...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="p-4 text-center text-brand-secondary text-sm w-full">
        No hay elementos disponibles
      </p>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <p className="p-4 text-center text-brand-secondary text-sm w-full">
        No se encontraron resultados
      </p>
    );
  }

  return (
    <>
      {filteredItems.map((item) => (
        <TagChip
          key={`${titleKey}-${item.id}`}
          label={item.nombre}
          isSelected={selectedIds.includes(item.id)}
          onClick={() => onToggle(item.id)}
        />
      ))}
    </>
  );
}
