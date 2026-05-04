"use server";

import {
  createCopias,
  deleteCopias,
  fetchInventario,
  fetchInventarioBookOptions,
  fetchInventarioCopiasByLibro,
  fetchInventarioStoreOptions,
  transferCopias,
  transferCopiasByQuantity,
} from "@/services/copia/copiaService";
import { getInventarioRows } from "@/models/copiaModel";
import { getDefaultTienda } from "@/models/tiendaModel";
import { requireAdminRole } from "@/lib/validations/server-auth";
import type { CopiaActionResponse } from "@/lib/types/copia";
import type {
  InventarioCopiasResponse,
  InventarioListResponse,
  InventarioOptionResponse,
  InventarioOptionsResponse,
  InventarioTransferBookOption,
  InventarioTransferBooksResponse,
} from "@/lib/types/inventario";
import {
  MAX_COPIAS_POR_INSERCION,
  isValidUUID,
  sanitizeText,
  toSafePositiveInt,
} from "@/lib/validations/rules";

function sanitizeUuidList(ids: string[]): string[] {
  return Array.from(
    new Set(
      ids.map((id) => sanitizeText(id)).filter((id) => id && isValidUUID(id)),
    ),
  );
}

export async function getInventarioAction(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  id_tienda?: string,
): Promise<InventarioListResponse> {
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 10);
  const cleanSearchTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  const sanitizedStoreId = id_tienda ? sanitizeText(id_tienda) : undefined;
  const cleanStoreId =
    sanitizedStoreId && isValidUUID(sanitizedStoreId)
      ? sanitizedStoreId
      : undefined;

  return await fetchInventario(
    safePage,
    safePageSize,
    cleanSearchTerm || undefined,
    cleanStoreId || undefined,
  );
}

export async function getInventarioStoreOptionsAction(): Promise<InventarioOptionsResponse> {
  return await fetchInventarioStoreOptions();
}

export async function getInventarioBookOptionsAction(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  const cleanSearchTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  return await fetchInventarioBookOptions(cleanSearchTerm || undefined);
}

export async function getInventarioDefaultStoreAction(): Promise<InventarioOptionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const defaultStore = await getDefaultTienda();
    if (!defaultStore) {
      return {
        success: false,
        errors: { form: "No existe una tienda principal activa." },
        message: "No existe una tienda principal activa.",
      };
    }

    return {
      success: true,
      data: {
        value: defaultStore.id,
        label: defaultStore.nombre,
      },
    };
  } catch (error) {
    console.error("Error cargando tienda principal de inventario:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado al cargar la tienda principal.",
    };
  }
}

export async function getInventarioTransferBooksByStoreAction(
  storeId: string,
): Promise<InventarioTransferBooksResponse> {
  const cleanStoreId = sanitizeText(storeId);
  if (!isValidUUID(cleanStoreId)) {
    return {
      success: false,
      errors: { id_tienda_origen: "La tienda origen no es válida." },
    };
  }

  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const rows = await getInventarioRows(undefined, cleanStoreId);
    const optionsByBook = new Map<string, InventarioTransferBookOption>();

    for (const row of rows) {
      if (!row.libro_id) continue;

      const maxAvailable = Math.max(0, row.stock_disponible ?? 0);
      if (maxAvailable === 0) continue;

      const previous = optionsByBook.get(row.libro_id);
      if (!previous) {
        optionsByBook.set(row.libro_id, {
          value: row.libro_id,
          label: `${row.titulo ?? "Sin título"} · ${row.isbn ?? "Sin ISBN"}`,
          subtitle: row.autor_libro ?? "Autor desconocido",
          max_copias_disponibles: maxAvailable,
        });
        continue;
      }

      previous.max_copias_disponibles += maxAvailable;
    }

    const options = Array.from(optionsByBook.values())
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((option) => ({
        ...option,
        subtitle: `${option.subtitle ?? "Autor desconocido"} · Máximo disponible: ${option.max_copias_disponibles}`,
      }));

    return {
      success: true,
      data: options,
    };
  } catch (error) {
    console.error("Error cargando libros disponibles para traslado:", error);
    return {
      success: false,
      message:
        "Ocurrió un error inesperado al cargar libros para traslado de inventario.",
    };
  }
}

export async function getInventarioCopiasAction(
  libroId: string,
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  storeIdFilter?: string,
): Promise<InventarioCopiasResponse> {
  const cleanLibroId = sanitizeText(libroId);
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 10);
  const cleanSearchTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  const sanitizedStoreId = storeIdFilter
    ? sanitizeText(storeIdFilter)
    : undefined;
  const cleanStoreId =
    sanitizedStoreId && isValidUUID(sanitizedStoreId)
      ? sanitizedStoreId
      : undefined;

  if (!isValidUUID(cleanLibroId)) {
    return {
      success: false,
      errors: { libro_id: "El identificador del libro no es válido." },
    };
  }

  return await fetchInventarioCopiasByLibro(
    cleanLibroId,
    safePage,
    safePageSize,
    cleanSearchTerm || undefined,
    cleanStoreId || undefined,
  );
}

export async function createInventarioAction(input: {
  id_libro: string;
  cantidad: number;
}): Promise<CopiaActionResponse> {
  const cleanLibroId = sanitizeText(input.id_libro);
  const safeQuantity = toSafePositiveInt(input.cantidad, 0);

  if (!isValidUUID(cleanLibroId)) {
    return {
      success: false,
      errors: { id_libro: "El libro seleccionado no es válido." },
    };
  }

  if (safeQuantity < 1) {
    return {
      success: false,
      errors: { cantidad: "La cantidad debe ser mayor a 0." },
    };
  }

  if (safeQuantity > MAX_COPIAS_POR_INSERCION) {
    return {
      success: false,
      errors: {
        cantidad: `La cantidad no puede ser mayor a ${MAX_COPIAS_POR_INSERCION}.`,
      },
    };
  }

  return await createCopias({
    id_libro: cleanLibroId,
    cantidad: safeQuantity,
    estado: "disponible",
  });
}

export async function transferInventarioCopiasAction(
  ids: string[],
  id_tienda: string,
): Promise<CopiaActionResponse> {
  const cleanIds = sanitizeUuidList(ids);
  const cleanStoreId = sanitizeText(id_tienda);

  if (cleanIds.length === 0) {
    return {
      success: false,
      errors: { ids: "Debes seleccionar al menos una copia para transferir." },
    };
  }

  if (!isValidUUID(cleanStoreId)) {
    return {
      success: false,
      errors: { id_tienda: "La tienda destino no es válida." },
    };
  }

  return await transferCopias({
    ids: cleanIds,
    id_tienda: cleanStoreId,
  });
}

export async function transferInventarioByQuantityAction(input: {
  id_tienda_origen: string;
  id_tienda_destino: string;
  id_libro: string;
  cantidad: number;
}): Promise<CopiaActionResponse> {
  const cleanStoreOriginId = sanitizeText(input.id_tienda_origen);
  const cleanStoreDestinationId = sanitizeText(input.id_tienda_destino);
  const cleanLibroId = sanitizeText(input.id_libro);
  const safeQuantity = toSafePositiveInt(input.cantidad, 0);

  if (!isValidUUID(cleanStoreOriginId)) {
    return {
      success: false,
      errors: { id_tienda_origen: "La tienda origen no es válida." },
    };
  }

  if (!isValidUUID(cleanStoreDestinationId)) {
    return {
      success: false,
      errors: { id_tienda_destino: "La tienda destino no es válida." },
    };
  }

  if (cleanStoreOriginId === cleanStoreDestinationId) {
    return {
      success: false,
      errors: {
        id_tienda_destino:
          "La tienda destino debe ser distinta a la tienda origen.",
      },
    };
  }

  if (!isValidUUID(cleanLibroId)) {
    return {
      success: false,
      errors: { id_libro: "El libro seleccionado no es válido." },
    };
  }

  if (safeQuantity < 1) {
    return {
      success: false,
      errors: { cantidad: "La cantidad debe ser mayor a 0." },
    };
  }

  return await transferCopiasByQuantity({
    id_tienda_origen: cleanStoreOriginId,
    id_tienda_destino: cleanStoreDestinationId,
    id_libro: cleanLibroId,
    cantidad: safeQuantity,
  });
}

export async function deleteInventarioCopiasAction(
  ids: string[],
): Promise<CopiaActionResponse> {
  const cleanIds = sanitizeUuidList(ids);

  if (cleanIds.length === 0) {
    return {
      success: false,
      errors: { ids: "Debes seleccionar al menos una copia para eliminar." },
    };
  }

  return await deleteCopias({
    ids: cleanIds,
  });
}
