import {
  countAvailableCopiasByLibro,
  getCopias as getCopiasModel,
  getCopiaById as getCopiaByIdModel,
  getCopiasByIds as getCopiasByIdsModel,
  getInventarioRows as getInventarioRowsModel,
  insertCopias,
  softDeleteCopias,
  transferCopias as transferCopiasModel,
} from "@/models/copiaModel";
import { getLatestHistoricoByLibro, insertHistorico } from "@/models/historicoModel";
import { getActiveLibroById, getLibros } from "@/models/libroModel";
import {
  getActiveTiendaByExactName,
  getActiveTiendaById,
  getTiendas,
} from "@/models/tiendaModel";

import type {
  CopiaActionResponse,
  CopiaDataResponse,
  CopiaRow,
  CreateCopiasInput,
  DeleteCopiasInput,
  OneOrManyCopyIds,
  TransferCopiasInput,
} from "@/lib/types/copia";
import type {
  InventarioCopiasResponse,
  InventarioCopiaDetalle,
  InventarioLibroItem,
  InventarioListResponse,
  InventarioOption,
  InventarioOptionsResponse,
  VistaInventarioRow,
} from "@/lib/types/inventario";
import type { EstadoHistorico } from "@/lib/types/historico";

import { requireAdminRole } from "@/lib/validations/server-auth";
import { isValidUUID, MAX_PAGE_SIZE } from "@/lib/validations/rules";

const DEFAULT_STORE = "Inventario General";

function toUniqueIds(ids: OneOrManyCopyIds): string[] {
  const source = Array.isArray(ids) ? ids : [ids];
  return Array.from(new Set(source));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
}

function aggregateInventarioRows(rows: VistaInventarioRow[]): InventarioLibroItem[] {
  const byBookId = new Map<string, InventarioLibroItem>();

  for (const row of rows) {
    if (!row.libro_id) continue;

    const available = row.stock_disponible ?? 0;
    const total = row.stock_total ?? 0;
    const previous = byBookId.get(row.libro_id);

    if (!previous) {
      byBookId.set(row.libro_id, {
        libro_id: row.libro_id,
        isbn_libro: row.isbn ?? "Sin ISBN",
        nombre_libro: row.titulo ?? "Sin título",
        autor_libro: row.autor_libro ?? "Autor desconocido",
        estado_libro: row.condicion_libro ?? "nuevo",
        cantidad_disponible: available,
        cantidad_total: total,
      });
      continue;
    }

    previous.cantidad_disponible += available;
    previous.cantidad_total += total;
  }

  return Array.from(byBookId.values()).sort((left, right) =>
    left.nombre_libro.localeCompare(right.nombre_libro),
  );
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const start = (safePage - 1) * safePageSize;
  const paginated = rows.slice(start, start + safePageSize);

  return {
    data: paginated,
    total: rows.length,
    page: safePage,
    pageSize: safePageSize,
    totalPages: rows.length === 0 ? 0 : Math.ceil(rows.length / safePageSize),
  };
}

async function getStoreNameById(storeId: string): Promise<string> {
  const store = await getActiveTiendaById(storeId);
  return store?.nombre ?? "Sin tienda asociada";
}

function mapCopiasToInventarioDetalle(
  rows: CopiaRow[],
  storeNames: Map<string, string>,
): InventarioCopiaDetalle[] {
  return rows.map((copy) => ({
    id_copia: copy.id,
    tienda_id: copy.id_tienda,
    nombre_tienda: storeNames.get(copy.id_tienda) ?? "Sin tienda asociada",
    estado_copia: copy.estado,
  }));
}

function getEstadoHistoricoFromAvailableCount(availableCount: number): EstadoHistorico {
  return availableCount === 0 ? "agotado" : "disponible";
}

async function syncHistoricoByBookStock(libroId: string): Promise<void> {
  const [availableCount, latestHistorico] = await Promise.all([
    countAvailableCopiasByLibro(libroId),
    getLatestHistoricoByLibro(libroId),
  ]);
  const targetState = getEstadoHistoricoFromAvailableCount(availableCount);

  if (latestHistorico?.estado === targetState) return;

  const historicoResult = await insertHistorico({
    id_libro: libroId,
    estado: targetState,
    fecha: new Date().toISOString(),
  });

  if (!historicoResult.success) {
    throw new Error(
      historicoResult.error ??
        `No se pudo registrar el estado histórico '${targetState}' para el libro ${libroId}.`,
    );
  }
}

async function syncHistoricoForBooks(libroIds: string[]): Promise<void> {
  const uniqueBookIds = Array.from(new Set(libroIds));
  if (uniqueBookIds.length === 0) return;
  await Promise.all(uniqueBookIds.map((bookId) => syncHistoricoByBookStock(bookId)));
}

async function resolveStoreId(idTienda?: string): Promise<{
  success: boolean;
  id_tienda?: string;
  error?: string;
}> {
  if (idTienda) {
    const store = await getActiveTiendaById(idTienda);
    if (!store) {
      return {
        success: false,
        error: "La tienda indicada no existe o fue eliminada.",
      };
    }
    return { success: true, id_tienda: store.id };
  }

  const inventoryStore = await getActiveTiendaByExactName(DEFAULT_STORE);
  if (!inventoryStore) {
    return {
      success: false,
      error: `No existe una tienda activa '${DEFAULT_STORE}' para inventario general.`,
    };
  }

  return { success: true, id_tienda: inventoryStore.id };
}

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Crea una o varias copias de un libro.
 * Si no se envía `id_tienda`, usa la tienda de inventario general.
 */
export async function createCopias(
  input: CreateCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  if (input.cantidad < 1) {
    return {
      success: false,
      errors: { cantidad: "La cantidad de copias debe ser mayor a 0." },
    };
  }

  try {
    const libro = await getActiveLibroById(input.id_libro);
    if (!libro) {
      return {
        success: false,
        errors: {
          id_libro: "El libro indicado no existe o fue eliminado.",
        },
      };
    }

    const storeResolution = await resolveStoreId(input.id_tienda);
    if (!storeResolution.success || !storeResolution.id_tienda) {
      return {
        success: false,
        errors: {
          id_tienda: storeResolution.error ?? "No se pudo resolver la tienda.",
        },
      };
    }
    const targetStoreId = storeResolution.id_tienda;

    const copiesToInsert = Array.from({ length: input.cantidad }, () => ({
      id_libro: input.id_libro,
      id_tienda: targetStoreId,
      estado: input.estado,
    }));

    const result = await insertCopias(copiesToInsert);
    if (!result.success) {
      return {
        success: false,
        errors: {
          form: result.error ?? "No se pudieron crear las copias.",
        },
        message: result.error ?? "No se pudieron crear las copias.",
      };
    }

    try {
      await syncHistoricoForBooks([input.id_libro]);
    } catch (historicoError: unknown) {
      console.error(
        "[copiaServices] Copias creadas correctamente, pero falló la sincronización del histórico:",
        historicoError,
      );
    }

    return {
      success: true,
      message:
        input.cantidad === 1
          ? "Copia creada exitosamente."
          : `${input.cantidad} copias creadas exitosamente.`,
    };
  } catch (error: unknown) {
    console.error("[copiaServices] Error inesperado al crear copias:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron crear las copias.",
    };
  }
}

/**
 * Traslada una o varias copias a una tienda destino.
 */
export async function transferCopias(
  input: TransferCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const copyIds = toUniqueIds(input.ids);
  if (copyIds.length === 0) {
    return {
      success: false,
      errors: { ids: "Debes indicar al menos una copia para trasladar." },
    };
  }

  try {
    const store = await getActiveTiendaById(input.id_tienda);
    if (!store) {
      return {
        success: false,
        errors: {
          id_tienda: "La tienda destino no existe o fue eliminada.",
        },
      };
    }

    const copiasInfo = await getInfos(copyIds);
    if (copiasInfo.length !== copyIds.length) {
      const foundIds = new Set(copiasInfo.map((copy) => copy.id));
      const missingIds = copyIds.filter((copyId) => !foundIds.has(copyId));
      return {
        success: false,
        errors: {
          ids: `No se encontraron las copias indicadas: ${missingIds.join(", ")}.`,
        },
      };
    }

    const result = await transferCopiasModel(copyIds, input.id_tienda);
    if (!result.success) {
      return {
        success: false,
        errors: {
          form: result.error ?? "No se pudieron trasladar las copias.",
        },
      };
    }

    // El traslado no cambia la disponibilidad global del libro, solo su tienda.
    // Por eso no se genera histórico de stock en esta operación.
    return {
      success: true,
      message:
        copyIds.length === 1
          ? "Copia trasladada exitosamente."
          : `${copyIds.length} copias trasladadas exitosamente.`,
    };
  } catch (error: unknown) {
    console.error(
      "[copiaServices] Error inesperado al trasladar copias:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron trasladar las copias.",
    };
  }
}

/**
 * Realiza eliminación lógica de una o varias copias.
 */
export async function deleteCopias(
  input: DeleteCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const copyIds = toUniqueIds(input.ids);
  if (copyIds.length === 0) {
    return {
      success: false,
      errors: { ids: "Debes indicar al menos una copia para eliminar." },
    };
  }

  try {
    const copiasInfo = await getInfos(copyIds);

    if (copiasInfo.length !== copyIds.length) {
      return {
        success: false,
        errors: { ids: "No se encontraron las copias indicadas." },
      };
    }

    // b. validar estado eliminable
    const invalidCopias = copiasInfo.filter(
      (copy) => copy.estado !== "disponible",
    );

    if (invalidCopias.length > 0) {
      return {
        success: false,
        errors: {
          ids: `No se pueden eliminar las copias con IDs: ${invalidCopias
            .map((c) => c.id)
            .join(", ")} porque no están disponibles o ya fueron eliminadas.`,
        },
      };
    }

    // c. eliminación lógica en una operación de modelo
    const result = await softDeleteCopias(copyIds);

    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudieron eliminar las copias." },
      };
    }

    await syncHistoricoForBooks(copiasInfo.map((copy) => copy.id_libro));

    return {
      success: true,
      message:
        copyIds.length === 1
          ? "Copia eliminada exitosamente."
          : `${copyIds.length} copias eliminadas exitosamente.`,
    };
  } catch (error: unknown) {
    console.error(
      "[copiaServices] Error inesperado al eliminar copias:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron eliminar las copias.",
    };
  }
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene una copia por ID junto con el nombre de la tienda.
 */
export async function getCopiaInfoById(
  copiaId: string,
): Promise<CopiaDataResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const copy = await getCopiaByIdModel(copiaId);
    if (!copy) {
      return {
        success: false,
        errors: { id: "La copia no existe o fue eliminada." },
      };
    }

    const store = await getActiveTiendaById(copy.id_tienda);

    return {
      success: true,
      data: {
        ...copy,
        tienda_nombre: store?.nombre ?? null,
      },
    };
  } catch (error: unknown) {
    console.error("[copiaServices] Error inesperado al obtener copia:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo obtener la informacion de la copia.",
    };
  }
}

/**
 * Lista el inventario por libro, con filtro opcional por tienda.
 * Si no hay tienda seleccionada, agrega el stock de todas las tiendas.
 */
export async function fetchInventario(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  id_tienda?: string,
): Promise<InventarioListResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const rows = await getInventarioRowsModel(searchTerm, id_tienda);
    const groupedByBook = aggregateInventarioRows(rows);
    const paginated = paginateRows(groupedByBook, page, pageSize);

    return {
      success: true,
      data: paginated,
    };
  } catch (error: unknown) {
    console.error("[copiaService] Error inesperado al listar inventario:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo cargar el inventario.",
    };
  }
}

/**
 * Obtiene el detalle de copias de un libro (todas las copias activas).
 */
export async function fetchInventarioCopiasByLibro(
  libroId: string,
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<InventarioCopiasResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const libro = await getActiveLibroById(libroId);
    if (!libro) {
      return {
        success: false,
        errors: { libro_id: "El libro indicado no existe o fue eliminado." },
        };
    }

    const normalizedSearchTerm = searchTerm?.trim();
    let copySearchTerm: string | undefined;
    let storeFilterId: string | undefined;

    if (normalizedSearchTerm) {
      if (isValidUUID(normalizedSearchTerm)) {
        copySearchTerm = normalizedSearchTerm;
      } else {
        const storesByTerm = await getTiendas(1, MAX_PAGE_SIZE, normalizedSearchTerm);
        const exactMatch = storesByTerm.data.find(
          (store) =>
            store.nombre.toLocaleLowerCase() === normalizedSearchTerm.toLocaleLowerCase(),
        );
        storeFilterId = exactMatch?.id ?? storesByTerm.data[0]?.id;

        if (!storeFilterId) {
          const safePage = Math.max(1, page);
          const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
          return {
            success: true,
            data: {
              data: [],
              total: 0,
              page: safePage,
              pageSize: safePageSize,
              totalPages: 0,
            },
          };
        }
      }
    }

    const paginatedCopies = await getCopiasModel(
      page,
      pageSize,
      copySearchTerm,
      storeFilterId,
      libroId,
    );

    const uniqueStoreIds = Array.from(
      new Set(paginatedCopies.data.map((copy) => copy.id_tienda)),
    );
    const storeEntries = await Promise.all(
      uniqueStoreIds.map(async (storeId) => {
        const storeName = await getStoreNameById(storeId);
        return [storeId, storeName] as const;
      }),
    );
    const storeNames = new Map<string, string>(storeEntries);
    const copies = mapCopiasToInventarioDetalle(paginatedCopies.data, storeNames);

    return {
      success: true,
      data: {
        ...paginatedCopies,
        data: copies,
      },
    };
  } catch (error: unknown) {
    console.error(
      "[copiaService] Error inesperado al obtener detalle de inventario:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo cargar el detalle del inventario.",
    };
  }
}

/**
 * Opciones de tiendas activas para filtros y formularios de inventario.
 */
export async function fetchInventarioStoreOptions(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const stores = await getTiendas(1, MAX_PAGE_SIZE, searchTerm);
    const options: InventarioOption[] = stores.data.map((store) => ({
      value: store.id,
      label: store.nombre,
      subtitle: store.direccion_formateada,
    }));

    return {
      success: true,
      data: options,
    };
  } catch (error: unknown) {
    console.error(
      "[copiaService] Error inesperado al listar opciones de tienda:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron cargar las tiendas disponibles.",
    };
  }
}

/**
 * Opciones de libros activos para formularios de inventario.
 */
export async function fetchInventarioBookOptions(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const libros = await getLibros(1, 30, searchTerm);
    const options: InventarioOption[] = libros.data.map((libro) => ({
      value: libro.id,
      label: `${libro.titulo} · ${libro.isbn}`,
      subtitle: libro.autor_nombre ?? "Autor desconocido",
    }));

    return {
      success: true,
      data: options,
    };
  } catch (error: unknown) {
    console.error(
      "[copiaService] Error inesperado al listar opciones de libro:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudieron cargar los libros disponibles.",
    };
  }
}

//helpers
async function getInfos(copiaIds: string[]): Promise<CopiaRow[]> {
  return getCopiasByIdsModel(copiaIds);
}
