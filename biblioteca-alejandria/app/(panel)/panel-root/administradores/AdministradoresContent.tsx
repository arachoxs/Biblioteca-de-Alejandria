"use client";

import Button from "@/components/ui/Button";
import FilterActionBar from "@/components/ui/FilterActionBar";
import { Plus, CheckCircle, UserX, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getAdmins } from "./action";
import Alert from "@/components/ui/Alert";
import type { AdminUserFromView } from "@/lib/types/profile";
import CreateAdminModal from "./CreateAdminModal";
import AdminsTable from "./AdminsTable";

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
  
  const itemsPerPage = 7;

  // Cargar administradores desde el servidor
  const loadAdmins = async (page: number = 1) => {
    setIsLoadingAdmins(true);
    setErrorLoadingAdmins(null);
    
    try {
      const response = await getAdmins(page, itemsPerPage);
      
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

  // Cargar administradores al montar el componente
  useEffect(() => {
    loadAdmins(currentPage);
  }, [currentPage]);

  // Filtrar datos localmente
  const filteredData = adminsData.filter((user) => {
    const nombre = `${user.nombres || ""} ${user.apellidos || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return nombre.includes(search) || email.includes(search);
  });

  const handlePageChange = (page: number) => { 
    setCurrentPage(page);
  };

  const handleSelectionChange = (ids: (string | number)[]) => {
    setSelectedIds(ids);
  };

  const handleEnable = () => {
    console.log("Habilitando usuarios:", selectedIds);
    alert(`Habilitando ${selectedIds.length} administrador(es)`);
    console.log("IDs seleccionados para habilitar:", selectedIds);
    // TODO: Implementar lógica de habilitación
    setSelectedIds([]); 
  };

  const handleDisable = () => {
    console.log("Deshabilitando usuarios:", selectedIds);
    alert(`Deshabilitando ${selectedIds.length} administrador(es)`);
    console.log("IDs seleccionados para deshabilitar:", selectedIds);
    // TODO: Implementar lógica de deshabilitación
    setSelectedIds([]);
  };

  const handleAdminCreated = async () => {
    // Recargar la lista de administradores después de crear uno nuevo
    await loadAdmins(currentPage);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedIds([]); // Limpiar selección al buscar
  };

  return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 relative">{errorLoadingAdmins && (
          <Alert 
            variant="error"
            className="mb-6 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            {errorLoadingAdmins}
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span className="inline">Habilitar</span>
                    </Button>
                    <Button
                        onClick={handleDisable}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    >
                        <UserX className="w-4 h-4" />
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