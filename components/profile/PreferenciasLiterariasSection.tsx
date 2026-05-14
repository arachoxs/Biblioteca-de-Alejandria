"use client";

import { useState, useEffect } from "react";
import PreferenceSelectionModal from "@/components/ui/PreferenceSelectionModal";
import Alert from "@/components/ui/Alert";
import { 
  getPreferenceDataAction, 
  updateAuthorPreferencesAction, 
  updateCategoryPreferencesAction 
} from "@/app/(with-navbar)/perfil/actions";

interface PreferenceItem {
  id: number;
  nombre: string;
}

export default function PreferenciasLiterariasSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"autores" | "categorias">("autores");
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [allAuthors, setAllAuthors] = useState<PreferenceItem[]>([]);
  const [allCategories, setAllCategories] = useState<PreferenceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!modalOpen) return;

    let ignore = false;
    setIsLoading(true);

    (async () => {
      try {
        const result = await getPreferenceDataAction();
        if (ignore) return;

        if (result.success) {
          setAllAuthors(result.authors);
          setAllCategories(result.categories);
          setSelectedAuthorIds(result.selectedAuthorIds);
          setSelectedCategoryIds(result.selectedCategoryIds);
        } else {
          showNotification("error", result.errors?.form ?? "Error al cargar datos");
        }
      } catch {
        if (!ignore) {
          showNotification("error", "Error inesperado al cargar preferencias");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [modalOpen]);

  function showNotification(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const [authorResult, categoryResult] = await Promise.all([
        updateAuthorPreferencesAction(selectedAuthorIds),
        updateCategoryPreferencesAction(selectedCategoryIds),
      ]);

      if (authorResult.success && categoryResult.success) {
        showNotification("success", "Preferencias guardadas correctamente");
        setModalOpen(false);
      } else {
        const errorMsg = !authorResult.success 
          ? authorResult.errors?.form ?? authorResult.message
          : categoryResult.errors?.form ?? categoryResult.message;
        showNotification("error", errorMsg ?? "Error al guardar");
      }
    } catch {
      showNotification("error", "Error inesperado al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClearAll() {
    if (activeTab === "autores") {
      setSelectedAuthorIds([]);
    } else {
      setSelectedCategoryIds([]);
    }
  }

  const currentItems = activeTab === "autores" ? allAuthors : allCategories;
  const currentSelectedIds = activeTab === "autores" ? selectedAuthorIds : selectedCategoryIds;
  const setCurrentSelectedIds = activeTab === "autores" ? setSelectedAuthorIds : setSelectedCategoryIds;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="text-left bg-white border border-brand-accent/25 rounded-lg p-6 shadow-[0_1px_3px_rgba(10,9,8,0.04)] transition-all hover:border-brand-primary hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group w-full"
      >
        <div className="w-12 h-12 rounded-full bg-brand-accent/12 grid place-items-center mb-3">
          <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-brand-primary mb-1.5 tracking-wide group-hover:underline underline-offset-2">
          Preferencias Literarias
        </h3>
        <p className="text-sm text-brand-secondary font-light leading-relaxed">
          Administra tus géneros favoritos y recibe recomendaciones personalizadas de libros.
        </p>
        <div className="mt-3 flex gap-2">
          {selectedAuthorIds.length > 0 && (
            <span className="text-xs bg-brand-accent/15 text-brand-secondary px-2 py-0.5 rounded-full">
              {selectedAuthorIds.length} autores
            </span>
          )}
          {selectedCategoryIds.length > 0 && (
            <span className="text-xs bg-brand-accent/15 text-brand-secondary px-2 py-0.5 rounded-full">
              {selectedCategoryIds.length} categorías
            </span>
          )}
        </div>
      </button>

      <PreferenceSelectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeTab === "autores" ? "Preferencias de Autores" : "Preferencias de Categorías"}
        subtitle="Selecciona los elementos que te interesen"
        items={currentItems}
        selectedIds={currentSelectedIds}
        onSelectionChange={setCurrentSelectedIds}
        onSave={handleSave}
        onClearAll={handleClearAll}
        isSaving={isSaving}
        isLoading={isLoading}
        tabSwitcher={
          <div className="flex gap-1 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("autores")}
              className={`px-4 py-1.5 text-sm rounded-full transition-all cursor-pointer ${
                activeTab === "autores"
                  ? "bg-brand-primary text-brand-bg font-medium"
                  : "bg-brand-accent/10 text-brand-secondary hover:bg-brand-accent/20"
              }`}
            >
              Autores
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("categorias")}
              className={`px-4 py-1.5 text-sm rounded-full transition-all cursor-pointer ${
                activeTab === "categorias"
                  ? "bg-brand-primary text-brand-bg font-medium"
                  : "bg-brand-accent/10 text-brand-secondary hover:bg-brand-accent/20"
              }`}
            >
              Categorías
            </button>
          </div>
        }
      />

      {notification && (
        <div className="fixed bottom-6 right-6 z-50">
          <Alert variant={notification.type === "success" ? "success" : "error"}>
            {notification.message}
          </Alert>
        </div>
      )}
    </>
  );
}
