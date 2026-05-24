import {
  getCopias as getCopiasModel,
  getCopiaById as getCopiaByIdModel,
  getCopiasByIds as getCopiasByIdsModel,
  getAvailableCopiasByLibroAndStore,
  getInventarioRows as getInventarioRowsModel,
  insertCopias,
  softDeleteCopias,
  transferCopias as transferCopiasModel,
  transferCopiasByQuantityAtomic,
  InsufficientStockError,
} from "@/models/copiaModel";
import {
  getHistoricoSyncSnapshotsByLibros,
  insertHistoricoBatch,
} from "@/models/historicoModel";
import { getActiveLibroById, getLibros } from "@/models/libroModel";
import {
  getActiveTiendaById,
  getActiveTiendasByIds,
  getAllActiveTiendas,
  getDefaultTienda,
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
  TransferCopiasByQuantityInput,
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
import type { TiendaRead } from "@/lib/types/tienda";
import type { EstadoHistorico } from "@/lib/types/historico";

import { requireAdminRole } from "@/lib/validations/server-auth";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";
import {
  buildTransferCopiasByQuantitySuccessMessage,
  getTransferCopiasByQuantityStockError,
  validateTransferCopiasByQuantityEntities,
} from "@/services/rules/copiaRules";
import { getCurrentUser } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { getErrorMessage } from "@/lib/services/errors";

function toUniqueIds(ids: OneOrManyCopyIds): string[] {
  const source = Array.isArray(ids) ? ids : [ids];
  return Array.from(new Set(source));
}

function aggregateInventarioRows(
  rows: VistaInventarioRow[],
): InventarioLibroItem[] {
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
    id_copia_seq: copy.codigo_seq ?? "",
    tienda_id: copy.id_tienda,
    nombre_tienda: storeNames.get(copy.id_tienda) ?? "Sin tienda asociada",
    estado_copia: copy.estado,
  }));
}

function getEstadoHistoricoFromAvailableCount(
  availableCount: number,
): EstadoHistorico {
  return availableCount === 0 ? "agotado" : "disponible";
}

async function syncHistoricoForBooks(libroIds: string[]): Promise<void> {
  const uniqueBookIds = Array.from(new Set(libroIds));
  if (uniqueBookIds.length === 0) return;

  const snapshots = await getHistoricoSyncSnapshotsByLibros(uniqueBookIds);
  const snapshotByBookId = new Map(
    snapshots.map((snapshot) => [snapshot.id_libro, snapshot]),
  );

  const missingBookIds = uniqueBookIds.filter(
    (bookId) => !snapshotByBookId.has(bookId),
  );
  if (missingBookIds.length > 0) {
    console.error(
      "[copiaServices] No se pudieron obtener snapshots de histórico para algunos libros.",
      { libroIds: missingBookIds },
    );
  }

  const now = new Date().toISOString();
  const historicoRows = snapshots.flatMap((snapshot) => {
    const targetState = getEstadoHistoricoFromAvailableCount(
      snapshot.available_count,
    );
    if (snapshot.latest_estado === targetState) return [];

    return [
      {
        id_libro: snapshot.id_libro,
        estado: targetState,
        fecha: now,
      },
    ];
  });

  if (historicoRows.length === 0) return;

  try {
    await insertHistoricoBatch(historicoRows);
  } catch (error) {
    console.error(
      getErrorMessage(error) ??
        "No se pudo registrar la sincronización del histórico de stock para los libros indicados.",
      {
        libroIds: historicoRows.map((row) => row.id_libro),
      },
    );
  }
}

// ─── Audit helpers ─────────────────────────────────────────────────

async function logCreateCopiasAudit(
  input: CreateCopiasInput,
  libroTitulo: string,
  targetStoreId: string,
): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor) return;
  const storeName = await getStoreNameById(targetStoreId);
  await logAdminAction({
    actorId: actor.id,
    action: AccionAdministrador.CREAR,
    description: `Se ingresaron ${input.cantidad} copias del libro "${libroTitulo}" en la tienda "${storeName}".`,
    entity: {
      id: input.id_libro,
      entity_type: "lote_copias",
      display_name: `${input.cantidad} copias de ${libroTitulo}`,
    },
  });
}

async function logTransferCopiasAudit(
  copyIds: string[],
  store: { id: string; nombre: string },
): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor) return;
  await logAdminAction({
    actorId: actor.id,
    action: AccionAdministrador.MODIFICAR,
    description: `Se transfirieron ${copyIds.length} copias a la tienda "${store.nombre}".`,
    entity: {
      id: store.id,
      entity_type: "lote_copias_transferidas",
      display_name: `${copyIds.length} copias -> ${store.nombre}`,
      copias_afectadas: copyIds,
    },
  });
}

async function logDeleteCopiasAudit(copyIds: string[]): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor) return;
  const copyCount = copyIds.length;
  await logAdminAction({
    actorId: actor.id,
    action: AccionAdministrador.ELIMINAR,
    description: `Se dieron de baja ${copyCount} copia${copyCount === 1 ? "" : "s"} del inventario.`,
    entity: {
      id: copyIds.length === 1 ? copyIds[0] : "lote_eliminacion",
      entity_type: "lote_copias_eliminadas",
      display_name: `${copyCount} copias eliminadas`,
      copias_afectadas: copyIds,
    },
  });
}

// ─── Escritura ─────────────────────────────────────────────────────

export async function createCopias(
  input: CreateCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const libro = await getActiveLibroById(input.id_libro);
    if (!libro) {
      return {
        success: false,
        errors: {
          id_libro: "El libro indicado no existe o fue eliminado.",
        },
        message: "El libro indicado no existe o fue eliminado.",
      };
    }

    const defaultStore = await getDefaultTienda();
    if (!defaultStore) {
      return {
        success: false,
        errors: {
          form: "No existe una tienda bodega activa para asignar el inventario general.",
        },
        message:
          "No existe una tienda bodega activa para asignar el inventario general.",
      };
    }
    const targetStoreId = defaultStore.id;

    const copiesToInsert = Array.from({ length: input.cantidad }, () => ({
      id_libro: input.id_libro,
      id_tienda: targetStoreId,
      estado: input.estado,
    }));

    try {
      await insertCopias(copiesToInsert);
    } catch (error) {
      return {
        success: false,
        errors: {
          form: getErrorMessage(error),
        },
        message: getErrorMessage(error),
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

    await logCreateCopiasAudit(input, libro.titulo, targetStoreId);

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

interface TransferValidationResult {
  ok: true
  store: NonNullable<Awaited<ReturnType<typeof getActiveTiendaById>>>
  copyIds: string[]
}
interface TransferValidationError {
  ok: false
  error: CopiaActionResponse
}

async function validateTransferInput(input: TransferCopiasInput): Promise<TransferValidationResult | TransferValidationError> {
  const copyIds = toUniqueIds(input.ids)
  const store = await getActiveTiendaById(input.id_tienda)
  if (!store) {
    return {
      ok: false,
      error: {
        success: false,
        errors: { id_tienda: "La tienda destino no existe o fue eliminada." },
        message: "La tienda destino no existe o fue eliminada.",
      },
    }
  }
  return { ok: true, store, copyIds }
}

async function checkCopiasNotAlreadyAtStore(
  copyIds: string[],
  store: NonNullable<Awaited<ReturnType<typeof getActiveTiendaById>>>,
): Promise<CopiaActionResponse | null> {
  const copiasInfo = await getCopiasByIdsModel(copyIds)
  const tiendasSet = new Set(copiasInfo.map((c) => c.id_tienda))
  if (tiendasSet.has(store.id)) {
    return {
      success: false,
      errors: {
        id_tienda: "Algunas de las copias ya pertenecen a la tienda destino.",
      },
      message: "No se pudieron trasladar las copias porque algunas ya pertenecen a la tienda destino.",
    }
  }
  return null
}

export async function transferCopias(
  input: TransferCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole()
  if (!roleCheck.success) return roleCheck

  const validation = await validateTransferInput(input)
  if (!validation.ok) return validation.error

  const { store, copyIds } = validation

  const duplicateError = await checkCopiasNotAlreadyAtStore(copyIds, store)
  if (duplicateError) return duplicateError

  let transferidos: string[] = []
  let fallidos: string[] = []

  try {
    const result = await transferCopiasModel(copyIds, input.id_tienda)
    transferidos = result.transferidos
    fallidos = result.fallidos
  } catch (error) {
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: getErrorMessage(error),
    }
  }

  if (fallidos.length > 0) {
    console.warn(`[copiaService] ${fallidos.length} copia(s) no fueron trasladadas:`, fallidos)
  }
  if (transferidos.length === 0) {
    return {
      success: false,
      errors: { form: "Ninguna de las copias estaba disponible para trasladar." },
      message: "No se pudieron trasladar las copias seleccionadas.",
    }
  }

  try {
    await logTransferCopiasAudit(transferidos, store)
  } catch (auditError) {
    console.warn("[copiaService] Audit log failed after successful transfer:", auditError)
  }

  return {
    success: true,
    message:
      transferidos.length === 1
        ? "Copia trasladada exitosamente."
        : `${transferidos.length} copias trasladadas exitosamente.`,
  }
}

export async function transferCopiasByQuantity(
  input: TransferCopiasByQuantityInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const safeQuantity = Math.max(1, input.cantidad);

  const entityValidation = await validateTransferEntities(input);
  if (!entityValidation.success && entityValidation.response) {
    return entityValidation.response;
  }

  const availableCopies = await getAvailableCopiasByLibroAndStore(
    input.id_libro,
    input.id_tienda_origen,
  );

  if (availableCopies === null) {
    return {
      success: false,
      errors: {
        form: "No se pudo verificar el stock disponible en la tienda de origen.",
      },
      message:
        "No se pudo verificar el stock disponible en la tienda de origen.",
    };
  }

  const stockError = getTransferCopiasByQuantityStockError({
    availableCount: availableCopies ?? 0,
    requestedQuantity: safeQuantity,
  });
  if (stockError) return stockError;

  let transferredIds: string[];
  try {
    transferredIds = await transferCopiasByQuantityAtomic({
      id_tienda_origen: input.id_tienda_origen,
      id_tienda_destino: input.id_tienda_destino,
      id_libro: input.id_libro,
      cantidad: safeQuantity,
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        transferredIds: error.transferredIds,
        errorCode: error.errorCode,
      } as CopiaActionResponse;
    }
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo trasladar el inventario por cantidad.",
    };
  }

  await logTransferCopiasAudit(
    transferredIds,
    entityValidation.destinationStore!,
  );

  return {
    success: true,
    message: buildTransferCopiasByQuantitySuccessMessage(safeQuantity),
  };
}

export async function deleteCopias(
  input: DeleteCopiasInput,
): Promise<CopiaActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  const copyIds = toUniqueIds(input.ids);

  try {
    const copiasInfo = await getCopiasByIdsModel(copyIds);

    if (copiasInfo.length !== copyIds.length) {
      return {
        success: false,
        errors: { ids: "No se encontraron las copias indicadas." },
        message:
          "No se pudieron eliminar las copias porque no se encontraron todas las indicadas.",
      };
    }

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
        message:
          "No se pudieron eliminar las copias porque no están disponibles o ya fueron eliminadas.",
      };
    }

    try {
      await softDeleteCopias(copyIds);
    } catch (error) {
      return {
        success: false,
        errors: { form: getErrorMessage(error) },
        message: getErrorMessage(error),
      };
    }

    try {
      await syncHistoricoForBooks(copiasInfo.map((copy) => copy.id_libro));
    } catch (historicoError: unknown) {
      console.error(
        "[copiaServices] Las copias fueron eliminadas, pero falló la sincronización del histórico:",
        historicoError,
      );
    }

    await logDeleteCopiasAudit(copyIds);

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
        message: "La copia no existe o fue eliminada.",
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
    console.error(
      "[copiaService] Error inesperado al listar inventario:",
      error,
    );
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo cargar el inventario.",
    };
  }
}

export async function fetchInventarioCopiasByLibro(
  libroId: string,
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  storeFilterId?: string,
): Promise<InventarioCopiasResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const libro = await getActiveLibroById(libroId);
    if (!libro) {
      return {
        success: false,
        errors: { libro_id: "El libro indicado no existe o fue eliminado." },
        message: "El libro indicado no existe o fue eliminado.",
      };
    }

    const { copySearchTerm, storeFilterId: storeFilterIdFromSearch } =
      parseSearchTermForCopias(searchTerm, storeFilterId);

    const finalStoreFilterId = storeFilterId ?? storeFilterIdFromSearch;

    const copySearchTermForQuery =
      storeFilterIdFromSearch && searchTerm?.trim()
        ? undefined
        : copySearchTerm;

    const paginatedCopies = await getCopiasModel(
      page,
      pageSize,
      copySearchTermForQuery,
      finalStoreFilterId,
      libroId,
    );

    const uniqueStoreIds = Array.from(
      new Set(paginatedCopies.data.map((copy) => copy.id_tienda)),
    );

    const tiendas = await getActiveTiendasByIds(uniqueStoreIds);
    const storeNames = new Map<string, string>(
      tiendas.map((t) => [t.id, t.nombre]),
    );

    const copies = mapCopiasToInventarioDetalle(
      paginatedCopies.data,
      storeNames,
    );

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

export async function fetchInventarioStoreOptions(): Promise<InventarioOptionsResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const stores = await getAllActiveTiendas();

    if (!stores.data) {
      return {
        success: false,
        errors: { form: "No se pudieron cargar las tiendas disponibles." },
        message: "No se pudieron cargar las tiendas disponibles.",
      };
    }

    const options: InventarioOption[] = stores.data.map((store) => ({
      value: store.id,
      label: store.nombre,
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

// ─── Helper functions ──────────────────────────────────────────────

interface TransferEntitiesValidation {
  success: boolean;
  response?: CopiaActionResponse;
  destinationStore?: TiendaRead | null;
}

async function validateTransferEntities(
  input: TransferCopiasByQuantityInput,
): Promise<TransferEntitiesValidation> {
  const originStore = await getActiveTiendaById(input.id_tienda_origen);
  const destinationStore = await getActiveTiendaById(input.id_tienda_destino);
  const libro = await getActiveLibroById(input.id_libro);
  const entityValidation = validateTransferCopiasByQuantityEntities({
    originStore,
    destinationStore,
    libroExists: Boolean(libro),
  });
  if (!entityValidation.success) {
    return { success: false, response: entityValidation.response };
  }
  return { success: true, destinationStore };
}

interface ParsedSearchTerm {
  copySearchTerm: string | undefined;
  storeFilterId: string | undefined;
}

function parseSearchTermForCopias(
  searchTerm?: string,
  storeFilterId?: string,
): ParsedSearchTerm {
  const normalizedSearchTerm = searchTerm?.trim();

  if (!normalizedSearchTerm?.length) {
    return { copySearchTerm: undefined, storeFilterId: undefined };
  }

  const isCodigoCopia = /^COP-\d{6}$/i.test(normalizedSearchTerm);
  if (isCodigoCopia) {
    return { copySearchTerm: normalizedSearchTerm, storeFilterId: undefined };
  }

  return { copySearchTerm: normalizedSearchTerm, storeFilterId: undefined };
}
