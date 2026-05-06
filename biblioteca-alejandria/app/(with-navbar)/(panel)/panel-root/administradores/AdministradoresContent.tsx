"use client";

import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import BackLink from "@/components/ui/BackLink";
import { Plus, CheckCircle, UserX, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getAdminUsersAction, habilitarAdministradores, deshabilitarAdministradores  } from "./action";
import Alert from "@/components/ui/Alert";
import type { AdminUserFromView } from "@/lib/types/profile";
import CreateAdminModal from "./CreateAdminModal";
import AdminsTable from "./AdminsTable";
import { useDebounce } from "@/hooks/useDebounce";
import type { UserStatusResult } from "@/lib/types/auth";

export default function AdministradoresContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para los datos de administradores
  const [adminsData, setAdminsData] = useState<AdminUserFromView[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [errorLoadingAdmins, setErrorLoadingAdmins] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Estado para las acciones de habilitar/deshabilitar
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [changeStateUserResponse, setChangeStateUserResponse] = useState<UserStatusResult | null>(null);
  
  const itemsPerPage = 7;

  // Usar el hook de debounce para el término de búsqueda
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  // Cargar administradores paginados desde el servidor
  const loadAdmins = async (page: number = 1, term: string = "") => {
    setIsLoadingAdmins(true);
    setErrorLoadingAdmins(null);
    
    try {
      const response = await getAdminUsersAction(page, itemsPerPage, term);
      
      if (response.success && response.data) {
        setAdminsData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
      } else {
        setErrorLoadingAdmins(response.message || "Error al cargar administradores");
        setAdminsData([]);
      }
    } catch (error) {
      console.error("Error cargando administradores:", error);
      setErrorLoadingAdmins("Error inesperado al cargar administradores");
      setAdminsData([]);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // Cargar administradores cuando cambie la página o el término de búsqueda
  useEffect(() => {
    loadAdmins(currentPage, debouncedSearchTerm);
  }, [debouncedSearchTerm, currentPage]);

  // Filtrar datos localmente (solo si no hay búsqueda del servidor)
  const filteredData = adminsData;

  const handlePageChange = (page: number) => { 
    setCurrentPage(page);
  };

  const handleSelectionChange = (ids: (string | number)[]) => {
    setSelectedIds(ids);
  };

  const handleEnable = async () => {
    if (selectedIds.length === 0) return;
    
    setIsEnabling(true);
    setChangeStateUserResponse(null);
    
    try {
      const usersToEnable = selectedIds
        .map(id => {
          const u = adminsData.find(a => a.id === id);
          return u ? { id: String(u.id), email: String(u.email) } : null;
        })
        .filter((u): u is { id: string; email: string } => u !== null);

      const result = await habilitarAdministradores(usersToEnable);
      
      // Guardar la respuesta para mostrar el alert
      setChangeStateUserResponse(result);

      if (result.success) {
        // Recargar la lista de administradores
        await loadAdmins(currentPage, debouncedSearchTerm);
        
        // Si hay IDs que fallaron, mantenerlos seleccionados
        if (result.errorIds && result.errorIds.length > 0) {
          setSelectedIds(result.errorIds);
        } else {
          // Si todo fue exitoso, limpiar selección
          setSelectedIds([]);
        }
      } else {
        // Si la operación falló completamente, mantener todos los IDs seleccionados
        if (result.errorIds && result.errorIds.length > 0) {
          setSelectedIds(result.errorIds);
        }
      }
    } catch (error) {
      console.error("Error al habilitar administradores:", error);
      setChangeStateUserResponse({
        success: false,
        message: "Error inesperado al habilitar administradores"
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable = async () => {
    if (selectedIds.length === 0) return;
    
    setIsDisabling(true);
    setChangeStateUserResponse(null);
    
    try {
      const usersToDisable = selectedIds
        .map(id => {
          const u = adminsData.find(a => a.id === id);
          return u ? { id: String(u.id), email: String(u.email) } : null;
        })
        .filter((u): u is { id: string; email: string } => u !== null);

      const result = await deshabilitarAdministradores(usersToDisable);
      
      // Guardar la respuesta para mostrar el alert
      setChangeStateUserResponse(result);
      
      if (result.success) {
        // Recargar la lista de administradores
        await loadAdmins(currentPage, debouncedSearchTerm);
        
        // Si hay IDs que fallaron, mantenerlos seleccionados
        if (result.errorIds && result.errorIds.length > 0) {
          setSelectedIds(result.errorIds);
        } else {
          // Si todo fue exitoso, limpiar selección
          setSelectedIds([]);
        }
      } else {
        // Si la operación falló completamente, mantener todos los IDs seleccionados
        if (result.errorIds && result.errorIds.length > 0) {
          setSelectedIds(result.errorIds);
        }
      }
    } catch (error) {
      console.error("Error al deshabilitar administradores:", error);
      setChangeStateUserResponse({
        success: false,
        message: "Error inesperado al deshabilitar administradores"
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleAdminCreated = async () => {
    // Recargar la lista de administradores después de crear uno nuevo
    await loadAdmins(currentPage, debouncedSearchTerm);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIds([]); // Limpiar selección al buscar
    setCurrentPage(1); // Reset a primera página al buscar
  };

  return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">
        <BackLink href="/panel-root" label="Panel de Control" />
        {/* Alert para errores de carga */}
        {errorLoadingAdmins && (
          <Alert variant="error">
            {errorLoadingAdmins}
          </Alert>
        )}

        {changeStateUserResponse?.success === true && !changeStateUserResponse?.errorIds?.length && (
          <Alert variant="success" onClose={() => setChangeStateUserResponse(null)}>
            {changeStateUserResponse.message || "Operación completada exitosamente"}
          </Alert>
        )}

        {changeStateUserResponse?.success === true && changeStateUserResponse?.errorIds && changeStateUserResponse.errorIds.length > 0 && (
          <Alert variant="warning" onClose={() => setChangeStateUserResponse(null)}>
            {`Operación parcialmente completada. ${changeStateUserResponse.errorIds.length} administrador(es) no pudieron ser procesados. ${changeStateUserResponse.message || ""}`}
          </Alert>
        )}

        {changeStateUserResponse?.success === false && (
          <Alert variant="error" onClose={() => setChangeStateUserResponse(null)}>
            {changeStateUserResponse.message || "Error al procesar la operación"}
          </Alert>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
                Gestión de Administradores
              </h1>
              {isLoadingAdmins && (
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
              )}
            </div>
            <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
              Supervisa y administra los accesos y privilegios del equipo administrativo.
              <br></br>
              {totalItems > 0 && (
                <span className="font-semibold text-brand-primary ml-1">
                  ({totalItems} {totalItems === 1 ? "administrador" : "administradores"})
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4">
            {selectedIds.length > 0 && (
                <div className="flex gap-2 w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <Button 
                        onClick={handleEnable}
                        disabled={isEnabling || isDisabling}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEnabling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span className="inline">Habilitar</span>
                    </Button>
                    <Button
                        onClick={handleDisable}
                        disabled={isEnabling || isDisabling}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDisabling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        <span className="inline">Deshabilitar</span>
                    </Button>
                    <div className="h-8 w-px bg-brand-accent/20 mx-1 hidden md:block"></div>
                </div>
            )}

            <Button
              className="flex items-center justify-center gap-2 w-full flex-2 min-w-64 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Nuevo Administrador
            </Button>
          </div>
        </div>

        {/* Modal Nuevo Administrador */}
        <CreateAdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAdminCreated}
        />

        {/* Filters & Actions Bar */}
        <FilterActionBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Buscar por nombre o email..."
        />
        
        {/* Table Section */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <AdminsTable
            data={filteredData}
            isLoading={isLoadingAdmins}
            error={null} // Error se muestra arriba con Alert
            searchTerm={searchTerm}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            selectedIds={selectedIds}
            onPageChange={handlePageChange}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </main>
  );
}
