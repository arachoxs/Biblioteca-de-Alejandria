"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import { Loader2, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  CategoryActionResponse,
  CategoryCreateInput,
  CategoryWithBookCount,
} from "@/lib/types/category";
import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
  updateCategoryAction,
} from "./action";
import CategoriasTable from "./CategoriasTable";
import CategoryFormModal from "./CategoryFormModal";

export default function CategoriasContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriasData, setCategoriasData] = useState<CategoryWithBookCount[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);
  const [errorLoadingCategorias, setErrorLoadingCategorias] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithBookCount | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionResponse, setActionResponse] =
    useState<CategoryActionResponse | null>(null);

  const itemsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  const loadCategories = async (page: number = 1, term: string = "") => {
    setIsLoadingCategorias(true);
    setErrorLoadingCategorias(null);

    try {
      const response = await getCategoriesAction(page, itemsPerPage, term);

      if (response.success && response.data) {
        setCategoriasData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
        return;
      }

      setErrorLoadingCategorias(response.message || "Error al cargar categorías");
      setCategoriasData([]);
    } catch (error: unknown) {
      console.error("Error cargando categorías:", error);
      setErrorLoadingCategorias("Error inesperado al cargar categorías");
      setCategoriasData([]);
    } finally {
      setIsLoadingCategorias(false);
    }
  };

  useEffect(() => {
    loadCategories(currentPage, debouncedSearchTerm);
  }, [debouncedSearchTerm, currentPage]);

  const handleCreateCategory = async (
    values: CategoryCreateInput,
  ): Promise<CategoryActionResponse> => {
    const response = await createCategoryAction(values);
    setActionResponse(response);
    return response;
  };

  const handleUpdateCategory = async (
    values: CategoryCreateInput,
  ): Promise<CategoryActionResponse> => {
    if (!editingCategory) {
      return {
        success: false,
        errors: { form: "No se encontró una categoría seleccionada para editar." },
      };
    }

    const response = await updateCategoryAction(editingCategory.id, {
      nombre: values.nombre,
      descripcion: values.descripcion,
    });
    setActionResponse(response);
    return response;
  };

  const handleDeleteCategory = async (category: CategoryWithBookCount) => {
    const shouldDelete = window.confirm(
      `¿Deseas eliminar la categoría "${category.nombre}"?`,
    );

    if (!shouldDelete) return;

    setDeletingId(category.id);
    setActionResponse(null);

    try {
      const response = await deleteCategoryAction(category.id);
      setActionResponse(response);

      if (!response.success) return;

      if (categoriasData.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadCategories(currentPage, debouncedSearchTerm);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategorySaved = async () => {
    await loadCategories(currentPage, debouncedSearchTerm);
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
      <BackLink href="/panel-admin" label="Panel de Administración" />
      {errorLoadingCategorias && (
        <Alert variant="error">
          {errorLoadingCategorias}
        </Alert>
      )}

      {actionResponse?.success && actionResponse.message && (
        <Alert
          variant="success"
          onClose={() => setActionResponse(null)}
        >
          {actionResponse.message}
        </Alert>
      )}

      {!actionResponse?.success && actionResponse?.message && (
        <Alert
          variant="error"
          onClose={() => setActionResponse(null)}
        >
          {actionResponse.message}
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Categorías
            </h1>
            {isLoadingCategorias && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Crea, edita y organiza las categorías disponibles para el catálogo de libros.
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "categoría" : "categorías"})
              </span>
            )}
          </p>
        </div>

        <Button
          className="flex items-center justify-center gap-2 w-full md:w-auto min-w-56 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar categorías por nombre..."
      />

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <CategoriasTable
          data={categoriasData}
          isLoading={isLoadingCategorias}
          error={null}
          searchTerm={searchTerm}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          deletingId={deletingId}
          onPageChange={setCurrentPage}
          onEdit={setEditingCategory}
          onDelete={handleDeleteCategory}
        />
      </div>

      <CategoryFormModal
        isOpen={isCreateModalOpen}
        title="Nueva Categoría"
        submitLabel="Crear Categoría"
        loadingLabel="Creando..."
        initialValues={{ nombre: "", descripcion: "" }}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
        onSuccess={handleCategorySaved}
      />

      <CategoryFormModal
        isOpen={Boolean(editingCategory)}
        title="Editar Categoría"
        submitLabel="Guardar Cambios"
        loadingLabel="Guardando..."
        initialValues={{
          nombre: editingCategory?.nombre ?? "",
          descripcion: editingCategory?.descripcion ?? "",
        }}
        onClose={() => setEditingCategory(null)}
        onSubmit={handleUpdateCategory}
        onSuccess={handleCategorySaved}
      />
    </main>
  );
}
