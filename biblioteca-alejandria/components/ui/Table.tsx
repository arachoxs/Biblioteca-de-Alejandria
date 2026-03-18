import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T) => string | number;
  emptyMessage?: ReactNode;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
  };
  selection?: {
    selectedIds: (string | number)[];
    onSelectionChange: (ids: (string | number)[]) => void;
  };
}

export default function Table<T>({
  columns, //columnas que tendra la tabla
  data, //informacion entregada a la tabla
  keyExtractor,
  emptyMessage = "No hay datos disponibles.",
  className = "",
  pagination, //informacion para la paginacion, si es que se requiere
  selection, //donde se van a almacenar las selecciones que se realicen
}: TableProps<T>) {
  const getKey = (item: T, index: number) => {
    return keyExtractor ? keyExtractor(item) : (item as any).id ?? index;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selection) return;
    if (e.target.checked) {
      // Select all visible items
      const allIds = data.map((item, i) => getKey(item, i));
      // Combine with existing selection if you want to keep selection across pages (complex)
      // Or just select current page (common simple behavior)
      // Let's assume current page selection for "select all" checkbox
      const newSelected = [...new Set([...selection.selectedIds, ...allIds])]; //se agrega los ya seleccionados y los nuevos
      selection.onSelectionChange(newSelected);
    } else {
      // Unselect all visible items
      const currentIds = new Set(data.map((item, i) => getKey(item, i)));
      const newSelected = selection.selectedIds.filter((id) => !currentIds.has(id));
      selection.onSelectionChange(newSelected);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (!selection) return;
    const newSelected = selection.selectedIds.includes(id)
      ? selection.selectedIds.filter((selectedId) => selectedId !== id)
      : [...selection.selectedIds, id]; //se agrega los que ya estaban y la nueva seleccion unica
    selection.onSelectionChange(newSelected); //se ejecuta la funcion que realiza los cambios de seleccion en el componente padre, se le entrega la nueva seleccion
  };

  const allVisibleSelected =
    selection && data.length > 0 && data.every((item, i) => selection.selectedIds.includes(getKey(item, i)));

  const isIndeterminate =
    selection &&
    data.length > 0 &&
    !allVisibleSelected &&
    data.some((item, i) => selection.selectedIds.includes(getKey(item, i)));

  return (
    <div
      className={`w-full overflow-hidden border border-brand-accent/20 rounded-xl bg-white shadow-sm flex flex-col ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-bg border-b border-brand-accent/20">
            <tr>
              {selection && (
                <th className="px-6 py-4 font-semibold text-brand-primary w-10">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-brand-secondary/40 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                      checked={allVisibleSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = !!isIndeterminate;
                      }}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
              )}
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 font-semibold text-brand-primary tracking-wide whitespace-nowrap ${col.className ?? ""
                    }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-accent/10">
            {data.length > 0 ? (
              data.map((item, rowIndex) => {
                const key = getKey(item, rowIndex);
                const isSelected = selection?.selectedIds.includes(key);

                return (
                  <tr
                    key={key}
                    className={`group transition-colors duration-150 ${isSelected ? "bg-brand-primary/5 hover:bg-brand-primary/10" : "hover:bg-brand-bg/40"
                      }`}
                  >
                    {selection && (
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-brand-secondary/40 text-brand-primary focus:ring-brand-primary/20 cursor-pointer accent-brand-primary"
                            checked={isSelected}
                            onChange={() => handleSelectRow(key)}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-4 text-brand-secondary group-hover:text-brand-text transition-colors whitespace-nowrap ${col.className ?? ""
                          }`}
                      >
                        {col.render
                          ? col.render(item)
                          : col.accessorKey
                            ? String(item[col.accessorKey])
                            : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (selection ? 1 : 0)}
                  className="px-6 py-12 text-center text-brand-secondary/70 italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-accent/10 bg-brand-bg/50">
          <p className="text-xs text-brand-secondary font-medium">
            Página <span className="text-brand-primary">{pagination.currentPage}</span> de <span className="text-brand-primary">{pagination.totalPages}</span>
            {pagination.totalItems && (
              <span className="hidden sm:inline"> • <span className="text-brand-primary">{pagination.totalItems}</span> resultados</span>
            )}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Simple logic to show a window of pages around current or start/end
                let pageNum = i + 1;
                if (pagination.totalPages > 5) {
                    if (pagination.currentPage > 3) {
                        pageNum = pagination.currentPage - 2 + i;
                    }
                    if (pageNum > pagination.totalPages) {
                        pageNum = pagination.totalPages - 4 + i;
                    }
                }
                return pageNum;
              }).map((page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                    pagination.currentPage === page
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                      : "bg-transparent text-brand-secondary hover:bg-brand-bg hover:text-brand-text"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 disabled:opacity-40 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all shadow-sm"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
