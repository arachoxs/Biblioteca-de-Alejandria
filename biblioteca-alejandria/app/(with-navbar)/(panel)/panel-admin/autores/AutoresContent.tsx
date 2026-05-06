"use client";

import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { obtenerAutores, eliminarAutor } from "./action";
import type { AuthorWithBookCount } from "@/lib/types/author";
import AutoresTable from "./AutoresTable";
import AuthorFormModal from "./AuthorFormModal";
import { useDebounce } from "@/hooks/useDebounce";
import type { AuthorActionResponse } from "@/lib/types/author";

export default function AutoresContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<AuthorWithBookCount | null>(null);

  // Estado datos paginados
  const [authors, setAuthors] = useState<AuthorWithBookCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 7;

  // Estado acciones — Set para permitir múltiples borrados concurrentes sin colisión
  const [actionResponse, setActionResponse] = useState<AuthorActionResponse | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // ─── Carga de datos ──────────────────────────────────────────────

  const loadAuthors = async (page: number = 1, term: string = "") => {
    setIsLoading(true);
    setErrorLoading(null);

    try {
      const response = await obtenerAutores(page, itemsPerPage, term);

      if (response.success && response.data) {
        // Redirigir automáticamente a la página anterior si el último ítem fue borrado
        if (response.data.data.length === 0 && page > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
          return;
        }

        setAuthors(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setErrorLoading(response.message || "Error al cargar autores");
        setAuthors([]);
      }
    } catch (error) {
      console.error("Error cargando autores:", error);
      setErrorLoading("Error inesperado al cargar autores");
      setAuthors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadAuthors(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleEditClick = (author: AuthorWithBookCount) => {
    setEditingAuthor(author);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditingAuthor(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAuthor(null);
  };

  const handleSuccess = async () => {
    await loadAuthors(currentPage, debouncedSearchTerm);
  };

  const handleDelete = async (author: AuthorWithBookCount) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar al autor "${author.nombre}"? Esta acción es un borrado lógico.`
      )
    ) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(author.id));
    setActionResponse(null);

    try {
      const response = await eliminarAutor(author.id, author.nombre || "Desconocido");
      setActionResponse(response);

      if (response.success) {
        await loadAuthors(currentPage, debouncedSearchTerm);
      }
    } catch {
      setActionResponse({
        success: false,
        message: "Error inesperado al eliminar el autor.",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(author.id);
        return next;
      });
    }
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
          onClose={() => setActionResponse(null)}
        >
          {actionResponse.message || "Operación completada exitosamente"}
        </Alert>
      )}

      {actionResponse?.success === false && (
        <Alert
          variant="error"
          onClose={() => setActionResponse(null)}
        >
          {actionResponse.message || "Error al procesar la operación"}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Autores
            </h1>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Administra el catálogo de autores de la biblioteca.
            <br />
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "autor" : "autores"})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4">
          <Button
            className="flex items-center justify-center gap-2 w-full flex-2 min-w-64 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
            onClick={handleNewClick}
          >
            <Plus className="w-4 h-4" />
            Nuevo Autor
          </Button>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <AuthorFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        author={editingAuthor}
      />

      {/* Barra de filtros */}
      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar por nombre o nacionalidad..."
      />

      {/* Tabla */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <AutoresTable
          data={authors}
          isLoading={isLoading}
          error={null}
          searchTerm={searchTerm}
          onRowClick={handleEditClick}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          deletingIds={deletingIds}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>
    </main>
  );
}
