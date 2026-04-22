import {
  getCopiaById as getCopiaByIdModel,
  getCopiasByIds as getCopiasByIdsModel,
  insertCopias,
  softDeleteCopias,
  transferCopias as transferCopiasModel,
  countAvailableCopiasByLibro,
} from "@/models/copiaModel";
import { getActiveLibroById } from "@/models/libroModel";
import {
  getActiveTiendaByExactName,
  getActiveTiendaById,
} from "@/models/tiendaModel";

import type {
  CopiaActionResponse,
  CopiaDataResponse,
  CreateCopiasInput,
  DeleteCopiasInput,
  OneOrManyCopyIds,
  TransferCopiasInput,
  CopiaRow as copiaObject,
} from "@/lib/types/copia";

import { requireAdminRole } from "@/lib/validations/server-auth";

const DEFAULT_STORE = "Inventario General";

function toUniqueIds(ids: OneOrManyCopyIds): string[] {
  const source = Array.isArray(ids) ? ids : [ids];
  return Array.from(new Set(source));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido";
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
      (copy) => copy.estado !== "disponible" || copy.deleted_at !== null,
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

    // c. validar cantidades por libro
    const copiasAgrupadas = groupCopiasByLibro(copiasInfo);
    const invalidQuantityBooks: string[] = [];

    for (const [idLibro, copiasByLibro] of Object.entries(copiasAgrupadas)) {
      const isValid = await validateQuantityToDelete(idLibro, copiasByLibro);
      if (!isValid) {
        invalidQuantityBooks.push(idLibro);
      }
    }

    if (invalidQuantityBooks.length > 0) {
      return {
        success: false,
        errors: {
          ids: `No se pueden eliminar las copias porque superan la cantidad de copias disponibles para los libros: ${invalidQuantityBooks.join(
            ", ",
          )}.`,
        },
      };
    }

    // d. eliminación lógica en una operación de modelo
    const result = await softDeleteCopias(copyIds);

    if (!result.success) {
      return {
        success: false,
        errors: { form: result.error ?? "No se pudieron eliminar las copias." },
      };
    }

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

//helpers
async function getInfos(copiaIds: string[]): Promise<copiaObject[]> {
  return getCopiasByIdsModel(copiaIds);
}

function groupCopiasByLibro(copias: copiaObject[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const copy of copias) {
    if (!grouped[copy.id_libro]) {
      grouped[copy.id_libro] = [];
    }
    grouped[copy.id_libro].push(copy.id);
  }

  return grouped;
}

async function validateQuantityToDelete(
  idLibro: string,
  copiasIds: string[],
): Promise<boolean> {
  //obtener la cantidad de copias disponibles del libro (disponible)
  const availableCount = await countAvailableCopiasByLibro(idLibro);

  //verificar que la cantidad de copias a eliminar no supere la cantidad de copias disponibles
  return copiasIds.length <= availableCount;
}
