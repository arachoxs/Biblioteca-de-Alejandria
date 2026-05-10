"use client";

import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import BackLink from "@/components/ui/BackLink";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLibrosAction, eliminarLibroAction } from "./action";
import type { LibroWithRelations, LibroActionResponse } from "@/lib/types/libro";
import LibrosTable from "./LibrosTable";
import { useDebounce } from "@/hooks/useDebounce";
import LibroHistoricoModal from "./LibroHistoricoModal";

export default function LibrosContent() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const [libros, setLibros] = useState<LibroWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 7;

  const [actionResponse, setActionResponse] = useState<LibroActionResponse | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [historicoLibro, setHistoricoLibro] = useState<LibroWithRelations | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // ─── Carga datos ─────────────────────────────────────────────────

  const loadLibros = async (page: number = 1, term: string = "") => {
    setIsLoading(true);
    setErrorLoading(null);

    try {
      const response = await getLibrosAction(page, itemsPerPage, term);

      if (response.success && response.data) {
        if (response.data.data.length === 0 && page > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
          return;
        }
        setLibros(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setErrorLoading(response.message || "Error al cargar libros");
        setLibros([]);
      }
    } catch (error) {
      console.error("Error cargando libros:", error);
      setErrorLoading("Error inesperado al cargar libros");
      setLibros([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadLibros(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  // ─── Handlers ────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleNewClick = () => {
    router.push("/panel-admin/registrar-libro");
  };

  const handleEdit = (libro: LibroWithRelations) => {
    router.push(`/panel-admin/editar-libro?id=${libro.id}`);
  };

  const handleDelete = async (libro: LibroWithRelations) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el libro "${libro.titulo}"? Esta acción es un borrado lógico.`,
      )
    ) {
      return;
    }

    const libroId = String(libro.id);
    setDeletingIds((prev) => new Set(prev).add(libroId));
    setActionResponse(null);

    try {
      const response = await eliminarLibroAction(
        libroId,
        libro.titulo || "Desconocido",
        libro.estado || "",
      );
      setActionResponse(response);

      if (response.success) {
        await loadLibros(currentPage, debouncedSearchTerm);
      }
    } catch {
      setActionResponse({
        success: false,
        message: "Error inesperado al eliminar el libro.",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(libroId);
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
              Gestión de Libros
            </h1>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Administra el catálogo bibliográfico de la biblioteca.
            <br />
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "libro" : "libros"})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4">
          <Button
            className="flex items-center justify-center gap-2 w-full flex-2 min-w-64 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
            onClick={handleNewClick}>
            <Plus className="w-4 h-4" />
            Registrar Libro
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar por título, ISBN, autor o editorial..."
      />

      {/* Tabla */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <LibrosTable
          data={libros}
          isLoading={isLoading}
          error={null}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewHistory={setHistoricoLibro}
          deletingIds={deletingIds}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      <LibroHistoricoModal
        isOpen={Boolean(historicoLibro)}
        libro={historicoLibro}
        onClose={() => setHistoricoLibro(null)}
      />
    </main>
  );
}
