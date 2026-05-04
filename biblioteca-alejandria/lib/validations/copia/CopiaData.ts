import type { CopiaActionResponse } from "@/lib/types/copia";
import type {
  InventarioCopiasResponse,
  InventarioTransferBookOption,
  InventarioTransferBooksResponse,
  VistaInventarioRow,
} from "@/lib/types/inventario";
import {
  MAX_COPIAS_POR_INSERCION,
  isValidUUID,
  sanitizeText,
  toSafePositiveInt,
} from "@/lib/validations/rules";

export function sanitizeUuidList(ids: string[]): string[] {
  return Array.from(
    new Set(
      ids.map((id) => sanitizeText(id)).filter((id) => id && isValidUUID(id)),
    ),
  );
}

export function sanitizeOptionalSearchTerm(searchTerm?: string): string | undefined {
  const cleanSearchTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  return cleanSearchTerm || undefined;
}

export function sanitizeOptionalStoreId(id_tienda?: string): string | undefined {
  const sanitizedStoreId = id_tienda ? sanitizeText(id_tienda) : undefined;
  return sanitizedStoreId && isValidUUID(sanitizedStoreId)
    ? sanitizedStoreId
    : undefined;
}

export function sanitizeInventarioListInput({
  page,
  pageSize,
  searchTerm,
  id_tienda,
}: {
  page: number;
  pageSize: number;
  searchTerm?: string;
  id_tienda?: string;
}) {
  return {
    page: toSafePositiveInt(page, 1),
    pageSize: toSafePositiveInt(pageSize, 10),
    searchTerm: sanitizeOptionalSearchTerm(searchTerm),
    id_tienda: sanitizeOptionalStoreId(id_tienda),
  };
}

export function sanitizeCreateInventarioInput(input: {
  id_libro: string;
  cantidad: number;
}) {
  return {
    id_libro: sanitizeText(input.id_libro),
    cantidad: toSafePositiveInt(input.cantidad, 0),
  };
}

export function sanitizeTransferInventarioCopiasInput(input: {
  ids: string[];
  id_tienda: string;
}) {
  return {
    ids: sanitizeUuidList(input.ids),
    id_tienda: sanitizeText(input.id_tienda),
  };
}

export function sanitizeTransferInventarioByQuantityInput(input: {
  id_tienda_origen: string;
  id_tienda_destino: string;
  id_libro: string;
  cantidad: number;
}) {
  return {
    id_tienda_origen: sanitizeText(input.id_tienda_origen),
    id_tienda_destino: sanitizeText(input.id_tienda_destino),
    id_libro: sanitizeText(input.id_libro),
    cantidad: toSafePositiveInt(input.cantidad, 0),
  };
}

export function getTransferBooksStoreIdValidationError(
  storeId: string,
): InventarioTransferBooksResponse | null {
  if (isValidUUID(storeId)) return null;
  return {
    success: false,
    errors: { id_tienda_origen: "La tienda origen no es válida." },
  };
}

export function getInventarioLibroIdValidationError(
  libroId: string,
): InventarioCopiasResponse | null {
  if (isValidUUID(libroId)) return null;
  return {
    success: false,
    errors: { libro_id: "El identificador del libro no es válido." },
  };
}

export function getCreateInventarioLibroIdValidationError(
  libroId: string,
): CopiaActionResponse | null {
  if (isValidUUID(libroId)) return null;
  return {
    success: false,
    errors: { id_libro: "El libro seleccionado no es válido." },
  };
}

export function getCreateInventarioMinQuantityValidationError(
  quantity: number,
): CopiaActionResponse | null {
  if (quantity > 0) return null;
  return {
    success: false,
    errors: { cantidad: "La cantidad debe ser mayor a 0." },
  };
}

export function getCreateInventarioMaxQuantityValidationError(
  quantity: number,
): CopiaActionResponse | null {
  if (quantity <= MAX_COPIAS_POR_INSERCION) return null;
  return {
    success: false,
    errors: {
      cantidad: `La cantidad no puede ser mayor a ${MAX_COPIAS_POR_INSERCION}.`,
    },
  };
}

export function getTransferInventarioIdsValidationError(
  ids: string[],
): CopiaActionResponse | null {
  if (ids.length > 0) return null;
  return {
    success: false,
    errors: { ids: "Debes seleccionar al menos una copia para transferir." },
  };
}

export function getTransferInventarioStoreIdValidationError(
  storeId: string,
): CopiaActionResponse | null {
  if (isValidUUID(storeId)) return null;
  return {
    success: false,
    errors: { id_tienda: "La tienda destino no es válida." },
  };
}

export function getTransferOriginStoreValidationError(
  storeId: string,
): CopiaActionResponse | null {
  if (isValidUUID(storeId)) return null;
  return {
    success: false,
    errors: { id_tienda_origen: "La tienda origen no es válida." },
  };
}

export function getTransferDestinationStoreValidationError(
  storeId: string,
): CopiaActionResponse | null {
  if (isValidUUID(storeId)) return null;
  return {
    success: false,
    errors: { id_tienda_destino: "La tienda destino no es válida." },
  };
}

export function getTransferDifferentStoresValidationError(
  originStoreId: string,
  destinationStoreId: string,
): CopiaActionResponse | null {
  if (originStoreId !== destinationStoreId) return null;
  return {
    success: false,
    errors: {
      id_tienda_destino:
        "La tienda destino debe ser distinta a la tienda origen.",
    },
  };
}

export function getTransferLibroIdValidationError(
  libroId: string,
): CopiaActionResponse | null {
  if (isValidUUID(libroId)) return null;
  return {
    success: false,
    errors: { id_libro: "El libro seleccionado no es válido." },
  };
}

export function getTransferQuantityValidationError(
  quantity: number,
): CopiaActionResponse | null {
  if (quantity > 0) return null;
  return {
    success: false,
    errors: { cantidad: "La cantidad debe ser mayor a 0." },
  };
}

export function getTransferInventarioByQuantityValidationError(input: {
  id_tienda_origen: string;
  id_tienda_destino: string;
  id_libro: string;
  cantidad: number;
}): CopiaActionResponse | null {
  return (
    getTransferOriginStoreValidationError(input.id_tienda_origen) ??
    getTransferDestinationStoreValidationError(input.id_tienda_destino) ??
    getTransferDifferentStoresValidationError(
      input.id_tienda_origen,
      input.id_tienda_destino,
    ) ??
    getTransferLibroIdValidationError(input.id_libro) ??
    getTransferQuantityValidationError(input.cantidad)
  );
}

export function getDeleteInventarioIdsValidationError(
  ids: string[],
): CopiaActionResponse | null {
  if (ids.length > 0) return null;
  return {
    success: false,
    errors: { ids: "Debes seleccionar al menos una copia para eliminar." },
  };
}

function sanitizeRequiredBookText(value: string | null): string | null {
  const cleanedValue = value ? sanitizeText(value) : "";
  return cleanedValue ? cleanedValue : null;
}

function getTransferBookMetadata(row: VistaInventarioRow): {
  title: string;
  isbn: string;
  subtitle: string;
} | null {
  const title = sanitizeRequiredBookText(row.titulo);
  if (!title) return null;

  const isbn = sanitizeRequiredBookText(row.isbn);
  if (!isbn) return null;

  return {
    title,
    isbn,
    subtitle: row.autor_libro ? sanitizeText(row.autor_libro) : "Autor desconocido",
  };
}

function toTransferBookOption(
  row: VistaInventarioRow,
): InventarioTransferBookOption | null {
  if (!row.libro_id) return null;

  const maxAvailable = Math.max(0, row.stock_disponible ?? 0);
  if (maxAvailable === 0) return null;

  const metadata = getTransferBookMetadata(row);
  if (!metadata) return null;

  return {
    value: row.libro_id,
    label: `${metadata.title} · ${metadata.isbn}`,
    subtitle: metadata.subtitle,
    max_copias_disponibles: maxAvailable,
  };
}

function mergeTransferBookOption(
  optionsByBook: Map<string, InventarioTransferBookOption>,
  option: InventarioTransferBookOption,
): void {
  const previous = optionsByBook.get(option.value);
  if (!previous) {
    optionsByBook.set(option.value, option);
    return;
  }

  previous.max_copias_disponibles += option.max_copias_disponibles;
}

export function buildTransferBookOptions(
  rows: VistaInventarioRow[],
): InventarioTransferBookOption[] {
  const optionsByBook = new Map<string, InventarioTransferBookOption>();

  for (const row of rows) {
    const option = toTransferBookOption(row);
    if (!option) continue;
    mergeTransferBookOption(optionsByBook, option);
  }

  return Array.from(optionsByBook.values())
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((option) => ({
      ...option,
      subtitle: `${option.subtitle} · Máximo disponible: ${option.max_copias_disponibles}`,
    }));
}
