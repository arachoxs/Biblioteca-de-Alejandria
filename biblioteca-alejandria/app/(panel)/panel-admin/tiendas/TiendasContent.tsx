"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import { AlertCircle, CheckCircle, Loader2, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  TiendaActionResponse,
  TiendaWithDireccion,
} from "@/lib/types/tienda";
import { deleteTiendaAction, getTiendasAction } from "./action";
import TiendasTable from "./TiendasTable";
import TiendaFormModal from "./TiendaFormModal";
import HorarioModal from "./HorarioModal";

export default function TiendasContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tiendasData, setTiendasData] = useState<TiendaWithDireccion[]>([]);
  const [isLoadingTiendas, setIsLoadingTiendas] = useState(true);
  const [errorLoadingTiendas, setErrorLoadingTiendas] = useState<string | null>(
    null,
  );
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTienda, setEditingTienda] =
    useState<TiendaWithDireccion | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [actionResponse, setActionResponse] =
    useState<TiendaActionResponse | null>(null);
  const [isModalHorarioOpen, setIsModalHorarioOpen] = useState<boolean>(false);
  const [modalHorarioTienda, setModalHorarioTienda] =
    useState<TiendaWithDireccion | null>(null);

  const itemsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadTiendas = async (page: number = 1, term: string = "") => {
    setIsLoadingTiendas(true);
    setErrorLoadingTiendas(null);

    try {
      const response = await getTiendasAction(page, itemsPerPage, term);

      if (response.success && response.data) {
        if (response.data.data.length === 0 && page > 1) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
          return;
        }

        setTiendasData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
        return;
      }

      setErrorLoadingTiendas(response.message || "Error al cargar tiendas");
      setTiendasData([]);
    } catch (error: unknown) {
      console.error("Error cargando tiendas:", error);
      setErrorLoadingTiendas("Error inesperado al cargar tiendas");
      setTiendasData([]);
    } finally {
      setIsLoadingTiendas(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTiendas(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleOpenCreate = () => {
    setEditingTienda(null);
    setIsModalOpen(true);
  };

  const handleOpenHorario = (tienda: TiendaWithDireccion) => {
    setModalHorarioTienda(tienda);
    setIsModalHorarioOpen(true);
  };

  const handleOpenEdit = (tienda: TiendaWithDireccion) => {
    setEditingTienda(tienda);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTienda(null);
  };

  const handleModalSuccess = async () => {
    setActionResponse({
      success: true,
      message: editingTienda
        ? "Tienda actualizada exitosamente."
        : "Tienda creada exitosamente.",
    });
    await loadTiendas(currentPage, debouncedSearchTerm);
  };

  const handleDelete = async (tienda: TiendaWithDireccion) => {
    const shouldDelete = window.confirm(
      `¿Deseas eliminar la tienda "${tienda.nombre}"?`,
    );
    if (!shouldDelete) return;

    setDeletingIds((prev) => new Set(prev).add(tienda.id));
    setActionResponse(null);

    try {
      const response = await deleteTiendaAction(tienda.id);
      setActionResponse(response);

      if (response.success) {
        await loadTiendas(currentPage, debouncedSearchTerm);
      }
    } catch {
      setActionResponse({
        success: false,
        message: "Error inesperado al eliminar la tienda.",
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(tienda.id);
        return next;
      });
    }
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
      {errorLoadingTiendas && (
        <Alert variant="error" className="mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorLoadingTiendas}
        </Alert>
      )}

      {actionResponse?.success && actionResponse.message && (
        <Alert
          variant="success"
          className="mb-6 flex items-center gap-2"
          onClose={() => setActionResponse(null)}>
          <CheckCircle className="w-4 h-4" />
          {actionResponse.message}
        </Alert>
      )}

      {!actionResponse?.success && actionResponse?.message && (
        <Alert
          variant="error"
          className="mb-6 flex items-center gap-2"
          onClose={() => setActionResponse(null)}>
          <AlertCircle className="w-4 h-4" />
          {actionResponse.message}
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Tiendas
            </h1>
            {isLoadingTiendas && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Administra sedes físicas, horarios de atención y dirección asociada.
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "tienda" : "tiendas"})
              </span>
            )}
          </p>
        </div>

        <Button
          className="flex items-center justify-center gap-2 w-full md:w-auto min-w-56 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
          onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          Nueva Tienda
        </Button>
      </div>

      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar tiendas por nombre..."
      />

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <TiendasTable
          data={tiendasData}
          isLoading={isLoadingTiendas}
          error={null}
          searchTerm={searchTerm}
          deletingIds={deletingIds}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onViewHorario={handleOpenHorario}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      <TiendaFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        tienda={editingTienda}
      />

      <HorarioModal
        isOpen={isModalHorarioOpen}
        onClose={() => setIsModalHorarioOpen(false)}
        tienda={modalHorarioTienda}
      />
    </main>
  );
}
