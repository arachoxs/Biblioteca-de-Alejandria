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
  InventarioTransferBooksResponse,
} from "@/lib/types/inventario";
import {
  buildTransferBookOptions,
  getCreateInventarioLibroIdValidationError,
  getCreateInventarioMaxQuantityValidationError,
  getCreateInventarioMinQuantityValidationError,
  getDeleteInventarioIdsValidationError,
  getInventarioLibroIdValidationError,
  getTransferBooksStoreIdValidationError,
  getTransferInventarioByQuantityValidationError,
  getTransferInventarioIdsValidationError,
  getTransferInventarioStoreIdValidationError,
  sanitizeCreateInventarioInput,
  sanitizeInventarioListInput,
  sanitizeOptionalSearchTerm,
  sanitizeTransferInventarioByQuantityInput,
  sanitizeTransferInventarioCopiasInput,
  sanitizeUuidList,
} from "@/lib/validations/copia";

export async function getInventarioAction(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  id_tienda?: string,
): Promise<InventarioListResponse> {
  const sanitizedInput = sanitizeInventarioListInput({
    page,
    pageSize,
    searchTerm,
    id_tienda,
  });

  return await fetchInventario(
    sanitizedInput.page,
    sanitizedInput.pageSize,
    sanitizedInput.searchTerm,
    sanitizedInput.id_tienda,
  );
}

export async function getInventarioStoreOptionsAction(): Promise<InventarioOptionsResponse> {
  return await fetchInventarioStoreOptions();
}

export async function getInventarioBookOptionsAction(
  searchTerm?: string,
): Promise<InventarioOptionsResponse> {
  return await fetchInventarioBookOptions(
    sanitizeOptionalSearchTerm({ searchTerm }),
  );
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
  const cleanStoreId = sanitizeUuidList({ ids: [storeId] })[0] ?? "";
  const storeError = getTransferBooksStoreIdValidationError({
    storeId: cleanStoreId,
  });
  if (storeError) return storeError;

  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const rows = await getInventarioRows(undefined, cleanStoreId);

    return {
      success: true,
      data: buildTransferBookOptions(rows),
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
  const cleanLibroId = sanitizeUuidList({ ids: [libroId] })[0] ?? "";
  const libroError = getInventarioLibroIdValidationError({
    libroId: cleanLibroId,
  });
  if (libroError) return libroError;
  const sanitizedInput = sanitizeInventarioListInput({
    page,
    pageSize,
    searchTerm,
    id_tienda: storeIdFilter,
  });

  return await fetchInventarioCopiasByLibro(
    //no esta llegando el objeto completo
    cleanLibroId,
    sanitizedInput.page,
    sanitizedInput.pageSize,
    sanitizedInput.searchTerm,
    sanitizedInput.id_tienda,
  );
}

export async function createInventarioAction(input: {
  id_libro: string;
  cantidad: number;
}): Promise<CopiaActionResponse> {
  const sanitizedInput = sanitizeCreateInventarioInput(input);
  const validationError =
    getCreateInventarioLibroIdValidationError({
      libroId: sanitizedInput.id_libro,
    }) ??
    getCreateInventarioMinQuantityValidationError({
      quantity: sanitizedInput.cantidad,
    }) ??
    getCreateInventarioMaxQuantityValidationError({
      quantity: sanitizedInput.cantidad,
    });
  if (validationError) return validationError;

  return await createCopias({
    id_libro: sanitizedInput.id_libro,
    cantidad: sanitizedInput.cantidad,
    estado: "disponible",
  });
}

export async function transferInventarioCopiasAction(
  ids: string[],
  id_tienda: string,
): Promise<CopiaActionResponse> {
  const sanitizedInput = sanitizeTransferInventarioCopiasInput({
    ids,
    id_tienda,
  });
  const validationError =
    getTransferInventarioIdsValidationError({ ids: sanitizedInput.ids }) ??
    getTransferInventarioStoreIdValidationError({
      storeId: sanitizedInput.id_tienda,
    });
  if (validationError) return validationError;

  return await transferCopias({
    ids: sanitizedInput.ids,
    id_tienda: sanitizedInput.id_tienda,
  });
}

export async function transferInventarioByQuantityAction(input: {
  id_tienda_origen: string;
  id_tienda_destino: string;
  id_libro: string;
  cantidad: number;
}): Promise<CopiaActionResponse> {
  const sanitizedInput = sanitizeTransferInventarioByQuantityInput(input);
  const validationError =
    getTransferInventarioByQuantityValidationError(sanitizedInput);
  if (validationError) return validationError;

  return await transferCopiasByQuantity({
    id_tienda_origen: sanitizedInput.id_tienda_origen,
    id_tienda_destino: sanitizedInput.id_tienda_destino,
    id_libro: sanitizedInput.id_libro,
    cantidad: sanitizedInput.cantidad,
  });
}

export async function deleteInventarioCopiasAction(
  ids: string[],
): Promise<CopiaActionResponse> {
  const cleanIds = sanitizeUuidList({ ids });
  const idsError = getDeleteInventarioIdsValidationError({ ids: cleanIds });
  if (idsError) return idsError;

  return await deleteCopias({
    ids: cleanIds,
  });
}
