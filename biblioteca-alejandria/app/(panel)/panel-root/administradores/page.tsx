"use client";

import RootNavbar from "@/components/RootNavbar";
import Button from "@/components/ui/Button";
import Table, { Column } from "@/components/ui/Table";
import { Plus, Search, CheckCircle, XCircle, UserX } from "lucide-react";
import { useState } from "react";

// Mock data for demonstration
interface AdminUser {
    id: string;
    nombre: string;
    email: string;
    activo: boolean; // Estado: true = Habilitado, false = Deshabilitado
}

const MOCK_DATA: AdminUser[] = []

export default function GestionAdministradoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const itemsPerPage = 7;

  // Filter data based on search term
  const filteredData = MOCK_DATA.filter((user) => 
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => { 
    setCurrentPage(page);
  };

  const handleSelectionChange = (ids: (string | number)[]) => {
    setSelectedIds(ids);
  };

  const handleEnable = () => { //logica para activar administradores
    console.log("Habilitando usuarios:", selectedIds);
    alert(`Habilitando ${selectedIds.length} administrador(es)`);
    // Lógica para habilitar
    setSelectedIds([]); // Limpiar selección o mantener según requerimiento
  };

  const handleDisable = () => { //logica para desactivar administradores
    console.log("Deshabilitando usuarios:", selectedIds);
    alert(`Deshabilitando ${selectedIds.length} administrador(es)`);
    // Lógica para deshabilitar
    setSelectedIds([]);
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "Nombre",
      accessorKey: "nombre",
      // Custom render to show avatar or initials if needed
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs ring-2 ring-brand-bg">
            {item.nombre
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-text text-sm">
              {item.nombre}
            </span>
            <span className="text-xs text-brand-secondary/70 lg:hidden">
              {item.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      className: "hidden lg:table-cell",
    },
    {
      header: "Estado",
      accessorKey: "activo",
      render: (item) => (
        <div className="flex items-center">
            <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                item.activo
                ? "bg-green-50 text-green-700 border-green-200/60"
                : "bg-red-50 text-red-700 border-red-200/60"
            }`}
            >
                {item.activo ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                    <XCircle className="w-3.5 h-3.5" />
                )}
            {item.activo ? "Habilitado" : "Deshabilitado"}
            </span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      <RootNavbar /> {/* Navbar específico para panel-root, si es necesario */}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary font-display tracking-tight">
              Gestión de Administradores
            </h1>
            <p className="text-brand-secondary text-sm md:text-base max-w-2xl leading-relaxed">
              Supervisa y administra los accesos y privilegios del equipo administrativo.
            </p>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end items-center gap-4">
            {selectedIds.length > 0 && (
                <div className="flex gap-2 w-full md:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
                    <Button 
                        onClick={handleEnable}
                        className="flex items-center h gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
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
              className="flex items-center gap-2 w-full flex-2 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow"
              onClick={() => alert("Funcionalidad de crear no implementada")}
            >
              <Plus className="w-4 h-4" />
              Nuevo Administrador
            </Button>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white p-1 rounded-xl border border-brand-accent/20 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-100 fill-mode-both">
          <div className="flex flex-col md:flex-row gap-2 p-3 items-center">
            <div className="relative flex-grow group w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary group-focus-within:text-brand-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-brand-bg/50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/10 transition-all text-brand-text placeholder:text-brand-secondary/60 hover:bg-brand-bg"
              />
            </div>

          </div>
        </div>

        {/* Table Section */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 fill-mode-both">
          <Table
            data={paginatedData}
            columns={columns}
            keyExtractor={(item) => item.id}
            pagination={{
                currentPage: currentPage, //pagina actual
                totalPages: totalPages, //cantidad de datos entre la cantidad de items por pagina
                onPageChange: handlePageChange, //funcion para cambiar de pagina
                totalItems: filteredData.length //cantidad total de items despues de aplicar filtros, se muestra en la parte inferior de la tabla
            }}
            selection={{
                selectedIds: selectedIds,
                onSelectionChange: handleSelectionChange
            }}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-brand-secondary/60">
                <div className="p-3 bg-brand-bg rounded-full">
                    <Search className="w-6 h-6" />
                </div>
                <p className="font-medium">No se encontraron administradores</p>
                <p className="text-xs">Intenta ajustar los filtros de búsqueda</p>
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}