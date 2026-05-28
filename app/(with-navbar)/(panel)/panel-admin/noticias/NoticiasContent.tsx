"use client";

import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getNoticiasAdminAction, reordenarNoticiasAction } from "./actions";
import type { NoticiaAdminItem, ReorderItem } from "@/lib/types/noticia";
import type { ActionResponse } from "@/lib/types/common";
import NoticiasTable from "./NoticiasTable";
import NoticiaEditModal from "./NoticiaEditModal";
import NoticiaImagesModal from "./NoticiaImagesModal";
import { useDebounce } from "@/hooks/useDebounce";

export default function NoticiasContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [noticias, setNoticias] = useState<NoticiaAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [actionResponse, setActionResponse] = useState<ActionResponse | null>(null);
  const [editingNoticia, setEditingNoticia] = useState<NoticiaAdminItem | null>(null);
  const [imagesNoticia, setImagesNoticia] = useState<NoticiaAdminItem | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // ─── Carga datos ─────────────────────────────────────────────────

  const loadNoticias = async (page: number = 1, term: string = "") => {
    setIsLoading(true);
    setErrorLoading(null);

    try {
      const response = await getNoticiasAdminAction(page, itemsPerPage, term);

      if (response.success && response.data) {
        if (response.data.data.length === 0 && page > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
          return;
        }
        setNoticias(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setErrorLoading(response.message || "Error al cargar noticias");
        setNoticias([]);
      }
    } catch (error) {
      console.error("Error cargando noticias:", error);
      setErrorLoading("Error inesperado al cargar noticias");
      setNoticias([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadNoticias(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleReorder = async (reorderedItems: ReorderItem[]) => {
    setActionResponse(null);

    try {
      const response = await reordenarNoticiasAction(reorderedItems);
      setActionResponse(response);

      if (response.success) {
        await loadNoticias(currentPage, debouncedSearchTerm);
      }
    } catch {
      setActionResponse({
        success: false,
        message: "Error inesperado al reordenar las noticias.",
      });
    }
  };

  const handleEditSuccess = async () => {
    setEditingNoticia(null);
    await loadNoticias(currentPage, debouncedSearchTerm);
  };

  const handleImagesSuccess = async () => {
    setImagesNoticia(null);
    await loadNoticias(currentPage, debouncedSearchTerm);
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
      <BackLink href="/panel-admin" label="Panel de Administración" />

      {/* Alerts */}
      {errorLoading && (
        <Alert variant="error">
          {errorLoading}
        </Alert>
      )}

      {actionResponse?.success === true && (
        <Alert
          variant="success"
          onClose={() => setActionResponse(null)}>
          {actionResponse.message || "Operación completada exitosamente"}
        </Alert>
      )}

      {actionResponse?.success === false && (
        <Alert
          variant="error"
          onClose={() => setActionResponse(null)}>
          {actionResponse.message || "Error al procesar la operación"}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Noticias
            </h1>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Administra las novedades vinculadas al catálogo de libros.
            <br />
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "noticia" : "noticias"})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar por título de libro..."
      />

      {/* Tabla */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <NoticiasTable
          data={noticias}
          isLoading={isLoading}
          error={null}
          searchTerm={searchTerm}
          onEdit={setEditingNoticia}
          onManageImages={setImagesNoticia}
          onReorder={handleReorder}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      {/* Modales */}
      <NoticiaEditModal
        isOpen={Boolean(editingNoticia)}
        noticia={editingNoticia}
        onClose={() => setEditingNoticia(null)}
        onSuccess={handleEditSuccess}
      />

      <NoticiaImagesModal
        isOpen={Boolean(imagesNoticia)}
        noticia={imagesNoticia}
        onClose={() => setImagesNoticia(null)}
        onSuccess={handleImagesSuccess}
      />
    </main>
  );
}
