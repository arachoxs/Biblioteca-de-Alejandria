"use client";

import { useState, useEffect } from "react";
import PreferenceSelectionModal from "@/components/ui/PreferenceSelectionModal";
import PreferenciasCard from "@/components/profile/PreferenciasCard";
import PreferenceTabSwitcher from "@/components/profile/PreferenceTabSwitcher";
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

function extractSaveError(
  authorResult: { success: boolean; errors?: Record<string, string>; message?: string },
  categoryResult: { success: boolean; errors?: Record<string, string>; message?: string }
): string {
  const failed = !authorResult.success ? authorResult : categoryResult;
  return failed.errors?.form ?? failed.message ?? "Error al guardar";
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
        showNotification("error", extractSaveError(authorResult, categoryResult));
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
      <PreferenciasCard
        authorCount={selectedAuthorIds.length}
        categoryCount={selectedCategoryIds.length}
        onOpen={() => setModalOpen(true)}
      />

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
          <PreferenceTabSwitcher
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
