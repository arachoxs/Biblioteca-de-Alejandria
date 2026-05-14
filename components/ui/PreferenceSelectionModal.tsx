"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import PreferenceItemsList from "@/components/ui/PreferenceItemsList";
import Modal from "@/components/ui/Modal";

export interface PreferenceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: Array<{ id: number; nombre: string }>;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onSave: () => void;
  onClearAll: () => void;
  isSaving?: boolean;
  isLoading?: boolean;
  tabSwitcher?: React.ReactNode;
}

export default function PreferenceSelectionModal({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
  selectedIds,
  onSelectionChange,
  onSave,
  onClearAll,
  isSaving = false,
  isLoading = false,
  tabSwitcher,
}: PreferenceSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSearchTerm("");
  }, [title]);

  const filteredItems = items.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {(subtitle || tabSwitcher) && (
          <div className="space-y-1 mb-2">
            {subtitle && (
              <p className="text-brand-secondary text-sm">{subtitle}</p>
            )}
            {tabSwitcher && <div className="mt-3">{tabSwitcher}</div>}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-accent" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-brand-bg text-brand-text placeholder:text-brand-accent rounded-lg border border-brand-accent/20 focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:border-brand-primary transition-all duration-200 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          {items.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={onClearAll}
                disabled={isLoading}
                className="text-sm text-brand-secondary hover:text-brand-primary underline transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpiar todo
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto py-1">
            <PreferenceItemsList
              isLoading={isLoading}
              items={items}
              filteredItems={filteredItems}
              selectedIds={selectedIds}
              titleKey={title}
              onToggle={handleToggle}
            />
          </div>
        </div>

        <div className="border-t border-brand-accent/10 pt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave} disabled={isSaving || isLoading}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}