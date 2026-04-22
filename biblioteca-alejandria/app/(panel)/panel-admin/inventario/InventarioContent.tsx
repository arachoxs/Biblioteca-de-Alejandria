"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import Alert from "@/components/ui/Alert";
import { AlertCircle, Boxes, CheckCircle, Loader2, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  InventarioLibroItem,
  InventarioOption,
} from "@/lib/types/inventario";
import InventarioTable from "./InventarioTable";
import AddInventarioModal from "./AddInventarioModal";
import InventarioDetailModal from "./InventarioDetailModal";
import { getInventarioAction, getInventarioStoreOptionsAction } from "./action";

interface FeedbackState {
  success: boolean;
  message: string;
}

export default function InventarioContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [inventarioData, setInventarioData] = useState<InventarioLibroItem[]>(
    [],
  );
  const [storeOptions, setStoreOptions] = useState<InventarioOption[]>([]);
  const [isLoadingInventario, setIsLoadingInventario] = useState(true);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailLibro, setDetailLibro] = useState<InventarioLibroItem | null>(
    null,
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const itemsPerPage = 10;
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  const loadStoreOptions = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const response = await getInventarioStoreOptionsAction();
      if (response.success && response.data) {
        setStoreOptions(response.data);
        return;
      }
      setStoreOptions([]);
    } catch (error) {
      console.error("Error cargando opciones de tiendas:", error);
      setStoreOptions([]);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  const loadInventario = useCallback(
    async (page: number, term: string, storeId: string) => {
      setIsLoadingInventario(true);
      setErrorLoading(null);

      try {
        const response = await getInventarioAction(
          page,
          itemsPerPage,
          term,
          storeId || undefined,
        );

        if (response.success && response.data) {
          if (response.data.data.length === 0 && page > 1) {
            setCurrentPage((prev) => Math.max(1, prev - 1));
            return;
          }

          setInventarioData(response.data.data);
          setTotalPages(response.data.totalPages);
          setTotalItems(response.data.total);
          return;
        }

        setInventarioData([]);
        setErrorLoading(response.message ?? "No se pudo cargar el inventario.");
      } catch (error) {
        console.error("Error cargando inventario:", error);
        setInventarioData([]);
        setErrorLoading("Ocurrió un error inesperado al cargar el inventario.");
      } finally {
        setIsLoadingInventario(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadStoreOptions();
  }, [loadStoreOptions]);

  useEffect(() => {
    void loadInventario(currentPage, debouncedSearchTerm, selectedStoreId);
  }, [currentPage, debouncedSearchTerm, selectedStoreId, loadInventario]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStoreFilter = (storeId: string) => {
    setSelectedStoreId(storeId);
    setCurrentPage(1);
  };

  const refreshCurrentData = async () => {
    await loadInventario(currentPage, debouncedSearchTerm, selectedStoreId);
  };

  const handleCreateSuccess = async (message: string) => {
    setFeedback({ success: true, message });
    await refreshCurrentData();
  };

  const handleDetailSuccess = async (message: string) => {
    setFeedback({ success: true, message });
    await refreshCurrentData();
  };

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
      {errorLoading && (
        <Alert variant="error" className="mb-6 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorLoading}
        </Alert>
      )}

      {feedback && (
        <Alert
          variant={feedback.success ? "success" : "error"}
          className="mb-6 flex items-center gap-2"
          onClose={() => setFeedback(null)}>
          {feedback.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {feedback.message}
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Inventario
            </h1>
            {isLoadingInventario && (
              <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
            )}
          </div>
          <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
            Controla el stock de libros y administra copias por tienda.
            {totalItems > 0 && (
              <span className="font-semibold text-brand-primary ml-1">
                ({totalItems} {totalItems === 1 ? "libro" : "libros"})
              </span>
            )}
          </p>
        </div>

        <Button
          className="flex items-center justify-center gap-2 w-full md:w-auto min-w-60 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={isLoadingStores}>
          <Plus className="w-4 h-4" />
          Agregar inventario
        </Button>
      </div>

      <section className="mb-6 bg-white border border-brand-accent/20 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Boxes className="w-4 h-4 text-brand-primary" />
          <h2 className="text-xl font-semibold text-brand-primary">
            Tiendas disponibles
          </h2>
        </div>

        {isLoadingStores ? (
          <div className="flex items-center gap-2 text-sm text-brand-secondary">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando tiendas...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                selectedStoreId === ""
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-brand-bg text-brand-secondary border-brand-accent/30 hover:bg-brand-primary/10 hover:text-brand-primary"
              }`}
              onClick={() => handleStoreFilter("")}>
              Todas las tiendas
            </button>
            {storeOptions.map((store) => (
              <button
                key={store.value}
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                  selectedStoreId === store.value
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "bg-brand-bg text-brand-secondary border-brand-accent/30 hover:bg-brand-primary/10 hover:text-brand-primary"
                }`}
                onClick={() => handleStoreFilter(store.value)}>
                {store.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <FilterActionBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        placeholder="Buscar por libro, autor o ISBN..."
      />

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
        <InventarioTable
          data={inventarioData}
          isLoading={isLoadingInventario}
          error={null}
          searchTerm={searchTerm}
          onViewDetail={setDetailLibro}
          pagination={{
            currentPage,
            totalPages,
            totalItems,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      <AddInventarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        storeOptions={storeOptions}
      />

      <InventarioDetailModal
        isOpen={Boolean(detailLibro)}
        libro={detailLibro}
        onClose={() => setDetailLibro(null)}
        onSuccess={handleDetailSuccess}
        storeOptions={storeOptions}
      />
    </main>
  );
}
