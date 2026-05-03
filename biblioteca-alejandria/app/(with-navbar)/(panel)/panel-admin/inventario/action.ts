"use server";

import {
  createCopias,
  deleteCopias,
  fetchInventario,
  fetchInventarioBookOptions,
  fetchInventarioCopiasByLibro,
  fetchInventarioStoreOptions,
  transferCopias,
} from "@/services/copia/copiaService";
import type { CopiaActionResponse } from "@/lib/types/copia";
import type {
  InventarioCopiasResponse,
  InventarioListResponse,
  InventarioOptionsResponse,
} from "@/lib/types/inventario";
import {
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

export async function getInventarioStoreOptionsAction(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  return await fetchInventarioStoreOptions();
}

export async function getInventarioBookOptionsAction(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  const cleanSearchTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  return await fetchInventarioBookOptions(cleanSearchTerm || undefined);
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
  id_tienda: string;
}): Promise<CopiaActionResponse> {
  const cleanLibroId = sanitizeText(input.id_libro);
  const cleanStoreId = sanitizeText(input.id_tienda);
  const safeQuantity = toSafePositiveInt(input.cantidad, 0);

  if (!isValidUUID(cleanLibroId)) {
    return {
      success: false,
      errors: { id_libro: "El libro seleccionado no es válido." },
    };
  }

  if (!isValidUUID(cleanStoreId)) {
    return {
      success: false,
      errors: { id_tienda: "La tienda seleccionada no es válida." },
    };
  }

  if (safeQuantity < 1) {
    return {
      success: false,
      errors: { cantidad: "La cantidad debe ser mayor a 0." },
    };
  }

  return await createCopias({
    id_libro: cleanLibroId,
    id_tienda: cleanStoreId,
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
