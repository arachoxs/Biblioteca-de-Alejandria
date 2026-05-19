"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

interface SearchFiltersProps {
  currentFilters: {
    q?: string;
    autor?: string;
    categoria?: string;
    ano_publicacion?: string;
    idioma?: string;
    editorial?: string;
    precioMin?: string;
    precioMax?: string;
    estado?: string;
  };
}

export default function SearchFilters({ currentFilters }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [searchParams]); // Sincroniza los filtros locales si cambia la URL (e.g. búsqueda en navbar o limpiar)

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    const filterKeys = ["autor", "categoria", "ano_publicacion", "idioma", "editorial", "precioMin", "precioMax", "estado"];
    
    filterKeys.forEach((key) => {
      const value = localFilters[key as keyof typeof localFilters];
      if (value && value.trim() !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/?${params.toString()}`);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`/?${params.toString()}`);
    setLocalFilters({});
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-brand-primary text-white p-3 rounded-full shadow-lg"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`
          lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-brand-accent/20
          transform transition-transform duration-300
          ${isOpen ? "translate-y-0" : "-translate-y-full"}
        `}
      >
        <div className="p-4 pb-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-brand-text">Filtros</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 text-brand-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <FiltersForm localFilters={localFilters} onFilterChange={handleFilterChange} />
          <div className="flex gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 border border-brand-accent/30 text-brand-text rounded-lg hover:bg-brand-accent/10 hover:border-brand-accent cursor-pointer transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 cursor-pointer transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white border border-brand-accent/20 rounded-xl p-4">
          <h2 className="font-display text-lg font-semibold text-brand-text mb-4">Filtros</h2>
          <FiltersForm localFilters={localFilters} onFilterChange={handleFilterChange} />
          <div className="flex gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 border border-brand-accent/30 text-brand-text rounded-lg text-sm hover:bg-brand-accent/10 hover:border-brand-accent cursor-pointer transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-primary/90 cursor-pointer transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function FiltersForm({
  localFilters,
  onFilterChange,
}: {
  localFilters: SearchFiltersProps["currentFilters"];
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Autor</label>
        <input
          type="text"
          value={localFilters.autor || ""}
          onChange={(e) => onFilterChange("autor", e.target.value)}
          placeholder="Nombre del autor"
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Editorial</label>
        <input
          type="text"
          value={localFilters.editorial || ""}
          onChange={(e) => onFilterChange("editorial", e.target.value)}
          placeholder="Nombre de la editorial"
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Idioma</label>
        <select
          value={localFilters.idioma || ""}
          onChange={(e) => onFilterChange("idioma", e.target.value)}
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="">Todos</option>
          <option value="Español">Español</option>
          <option value="Inglés">Inglés</option>
          <option value="Francés">Francés</option>
          <option value="Alemán">Alemán</option>
          <option value="Portugués">Portugués</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Categoría</label>
        <input
          type="text"
          value={localFilters.categoria || ""}
          onChange={(e) => onFilterChange("categoria", e.target.value)}
          placeholder="Género o categoría"
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Año de publicación</label>
        <input
          type="number"
          value={localFilters.ano_publicacion || ""}
          onChange={(e) => onFilterChange("ano_publicacion", e.target.value)}
          placeholder="Ej: 2023"
          min="1900"
          max={new Date().getFullYear()}
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Precio (COP)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={localFilters.precioMin || ""}
            onChange={(e) => onFilterChange("precioMin", e.target.value)}
            placeholder="Mín"
            min="0"
            className="w-1/2 px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <input
            type="number"
            value={localFilters.precioMax || ""}
            onChange={(e) => onFilterChange("precioMax", e.target.value)}
            placeholder="Máx"
            min="0"
            className="w-1/2 px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-brand-secondary mb-1">Estado</label>
        <select
          value={localFilters.estado || ""}
          onChange={(e) => onFilterChange("estado", e.target.value)}
          className="w-full px-3 py-2 border border-brand-accent/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="">Todos</option>
          <option value="nuevo">Nuevo</option>
          <option value="usado">Usado</option>
        </select>
      </div>
    </div>
  );
}