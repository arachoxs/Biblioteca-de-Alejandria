import { createAdminClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type {
  CopiaRow,
  EstadoCopia,
  InsertCopiaPayload,
  TransferCopiasByQuantityInput,
  UpdateCopiaPayload,
} from "@/lib/types/copia";
import type {
  VistaInventarioRow,
} from "@/lib/types/inventario";
import { buildOrILikeFilter } from "@/lib/validations/db-utils";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

export type TransferCopiasByQuantityErrorCode =
  | "INSUFFICIENT_STOCK"
  | "ROLLBACK_FAILED";

export class InsufficientStockError extends Error {
  readonly errorCode: TransferCopiasByQuantityErrorCode;
  readonly transferredIds: string[];

  constructor(
    message: string,
    errorCode: TransferCopiasByQuantityErrorCode,
    transferredIds: string[] = []
  ) {
    super(message);
    this.name = "InsufficientStockError";
    this.errorCode = errorCode;
    this.transferredIds = transferredIds;
  }
}

export async function insertCopias(
  data: InsertCopiaPayload[],
): Promise<void> {
  const adminClient = createAdminClient();

  const payload = data.map((copy) => ({
    id_libro: copy.id_libro,
    id_tienda: copy.id_tienda,
    estado: copy.estado,
  }));

  const { error } = await adminClient
    .from("copia")
    .insert(payload)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error insertando copias:", error);
    throw error;
  }
}

export async function updateCopia(
  id: string,
  data: UpdateCopiaPayload,
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("copia")
    .update({
      estado: data.estado,
      id_tienda: data.id_tienda,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[copiaModel] Error actualizando copia:", error);
    throw error;
  }
}

/**
 * Transición atómica del estado de una copia.
 * Solo actualiza si el estado actual coincide con `fromEstado`.
 * Retorna `true` si la transición se realizó, `false` si no coincidía.
 */
export async function updateCopiaEstadoIf(
  id: string,
  fromEstado: EstadoCopia,
  toEstado: EstadoCopia,
): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .update({ estado: toEstado })
    .eq("id", id)
    .eq("estado", fromEstado)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error en transición de estado de copia:", error);
    throw error;
  }

  return (data ?? []).length > 0;
}

/**
 * Transición atómica masiva del estado de múltiples copias.
 * Solo actualiza las que tengan el estado `fromEstado`.
 * Retorna los IDs de las copias que efectivamente cambiaron de estado.
 */
export async function updateCopiaEstadoIfBatch(
  ids: string[],
  fromEstado: EstadoCopia,
  toEstado: EstadoCopia,
): Promise<string[]> {
  if (ids.length === 0) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .update({ estado: toEstado })
    .in("id", ids)
    .eq("estado", fromEstado)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error en transición masiva de estado:", error);
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

export async function transferCopias(
  ids: string[],
  id_tienda: string,
): Promise<void> {
  const adminClient = createAdminClient();

  const { data: updatedRows, error } = await adminClient
    .from("copia")
    .update({ id_tienda })
    .in("id", ids)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error trasladando copias:", error);
    throw error;
  }

  if ((updatedRows ?? []).length !== ids.length) {
    throw new Error("No se pudieron trasladar todas las copias solicitadas.");
  }
}

async function getCopiasForTransferByQuantity(
  id_libro: string,
  id_tienda_origen: string,
  cantidad: number,
): Promise<string[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .select("id")
    .eq("id_libro", id_libro)
    .eq("id_tienda", id_tienda_origen)
    .eq("estado", "disponible")
    .is("deleted_at", null)
    .order("id", { ascending: true })
    .limit(cantidad);

  if (error) {
    console.error(
      "[copiaModel] Error obteniendo copias para traslado por cantidad:",
      error,
    );
    throw error;
  }

  return (data ?? []).map((c) => c.id);
}

async function rollbackTransferByQuantity(
  ids: string[],
  id_tienda_origen: string,
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("copia")
    .update({ id_tienda: id_tienda_origen })
    .in("id", ids)
    .is("deleted_at", null);

  if (error) {
    console.error(
      "[copiaModel] Error en rollback de traslado por cantidad:",
      error,
    );
    throw error;
  }
}

async function handlePartialTransferRollback(
  transferredIds: string[],
  id_tienda_origen: string,
): Promise<never> {
  if (transferredIds.length === 0) {
    throw new InsufficientStockError(
      "No hay suficientes copias disponibles en la tienda origen para completar el traslado.",
      "INSUFFICIENT_STOCK",
      transferredIds,
    );
  }

  await rollbackTransferByQuantity(transferredIds, id_tienda_origen);

  throw new InsufficientStockError(
    "No hay suficientes copias disponibles en la tienda origen para completar el traslado.",
    "INSUFFICIENT_STOCK",
    transferredIds,
  );
}

export async function transferCopiasByQuantityAtomic(
  input: TransferCopiasByQuantityInput,
): Promise<string[]> {
  const adminClient = createAdminClient();
  const safeQuantity = Math.max(1, input.cantidad);

  const copiasForTransfer = await getCopiasForTransferByQuantity(
    input.id_libro,
    input.id_tienda_origen,
    safeQuantity,
  );

  if (copiasForTransfer.length === 0) {
    throw new InsufficientStockError(
      "No hay copias disponibles en la tienda origen para el libro especificado.",
      "INSUFFICIENT_STOCK"
    );
  }

  const { data: updatedRows, error: updateError } = await adminClient
    .from("copia")
    .update({ id_tienda: input.id_tienda_destino })
    .in("id", copiasForTransfer)
    .select("id");

  if (updateError) throw updateError;

  const transferredIds = (updatedRows ?? []).map((row) => row.id);
  if (transferredIds.length === safeQuantity) {
    return transferredIds;
  }

  return handlePartialTransferRollback(
    transferredIds,
    input.id_tienda_origen,
  );
}

export async function softDeleteCopias(ids: string[]): Promise<void> {
  const adminClient = createAdminClient();

  const { data: updatedRows, error } = await adminClient
    .from("copia")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error en softDeleteManyCopiasModel:", error);
    throw error;
  }

  if ((updatedRows ?? []).length !== ids.length) {
    throw new Error("No se pudieron eliminar todas las copias solicitadas.");
  }
}
// ─── Lectura ───────────────────────────────────────────────────────

// ─── Escritura ─────────────────────────────────────────────────────

export async function getCopiaById(id: string): Promise<CopiaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[copiaModel] Error obteniendo copia por id:", error);
    throw error;
  }

  return data;
}

export async function getCopiasByIds(ids: string[]): Promise<CopiaRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .select("*")
    .in("id", ids)
    .is("deleted_at", null);

  if (error) {
    console.error("[copiaModel] Error obteniendo copias por ids:", error);
    throw error;
  }

  const rows = data ?? [];

  if (rows.length !== ids.length) {
    throw new Error("No se encontraron todas las copias solicitadas.");
  }

  return rows;
}

export async function getAvailableCopiasByLibroAndStore(
  id_libro: string,
  id_tienda: string,
): Promise<number | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("vista_inventario")
    .select("stock_disponible")
    .eq("libro_id", id_libro)
    .eq("tienda_id", id_tienda)
    .maybeSingle();

  if (error) {
    console.error(
      "[copiaModel] Error obteniendo copias disponibles por libro y tienda:",
      error,
    );
    throw error;
  }

  return (
    (data as { stock_disponible?: number | null } | null)?.stock_disponible ??
    null
  );
}

type CopiasFilters = {
  searchTerm?: string;
  id_tienda?: string;
  id_libro?: string;
};

type PaginationBounds = {
  safePage: number;
  safePageSize: number;
  from: number;
  to: number;
};

function buildPaginationBounds(page: number, pageSize: number): PaginationBounds {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { safePage, safePageSize, from, to };
}

function applyCopiasFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: CopiasFilters,
) {
  if (filters.id_tienda) query = query.eq("id_tienda", filters.id_tienda);
  if (filters.id_libro) query = query.eq("id_libro", filters.id_libro);
  if (filters.searchTerm?.trim()) {
    query = query.ilike("codigo_seq", `%${filters.searchTerm.trim()}%`);
  }
  return query;
}

function applyInventarioFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  searchTerm?: string,
  id_tienda?: string,
) {
  if (id_tienda) query = query.eq("tienda_id", id_tienda);
  if (searchTerm?.trim()) {
    query = query.or(buildOrILikeFilter(["titulo", "autor_libro", "isbn"], searchTerm));
  }
  return query;
}

export async function getInventarioRows(
  searchTerm?: string,
  id_tienda?: string,
): Promise<VistaInventarioRow[]> {
  const adminClient = createAdminClient();

  const query = applyInventarioFilters(
    adminClient
      .from("vista_inventario")
      .select("*")
      .order("titulo", { ascending: true, nullsFirst: false }),
    searchTerm,
    id_tienda,
  );

  const { data, error } = await query;

  if (error) {
    console.error("[copiaModel] Error listando inventario:", error);
    throw error;
  }

  return data ?? [];
}

export async function getCopias(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  id_tienda?: string,
  id_libro?: string,
): Promise<Paginated<CopiaRow>> {
  const adminClient = createAdminClient();

  const { safePage, safePageSize, from, to } = buildPaginationBounds(page, pageSize);

  const filters: CopiasFilters = { searchTerm, id_tienda, id_libro };
  const query = applyCopiasFilters(
    adminClient
      .from("copia")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .range(from, to)
      .order("id", { ascending: false }),
    filters,
  );

  const { data, error, count } = await query;

  if (error) {
    console.error("[copiaModel] Error listando copias:", error);
    throw error;
  }

  const totalCount = count || 0;

  return {
    data: data || [],
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

export async function countCopiasByLibro(id_libro: string): Promise<number> {
  const adminClient = createAdminClient();

  const { count, error } = await adminClient
    .from("copia")
    .select("id", { count: "exact", head: true })
    .eq("id_libro", id_libro)
    .is("deleted_at", null);

  if (error) {
    console.error("[copiaModel] Error contando copias por libro:", error);
    throw error;
  }

  return count ?? 0;
}

export async function getCopiaIdsByLibro(
  id_libro: string,
): Promise<string[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("copia")
    .select("id")
    .eq("id_libro", id_libro)
    .is("deleted_at", null);

  if (error) {
    console.error("[copiaModel] Error obteniendo IDs de copias por libro:", error);
    throw error;
  }

  return (data ?? []).map((c) => c.id);
}

/**
 * Obtiene los IDs de copias disponibles (estado = "disponible")
 * de un libro, hasta un límite opcional.
 */
export async function getAvailableCopiaIdsByLibro(
  id_libro: string,
  limit?: number,
): Promise<string[]> {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("copia")
    .select("id")
    .eq("id_libro", id_libro)
    .eq("estado", "disponible")
    .is("deleted_at", null)
    .order("id", { ascending: true });

  if (limit !== undefined && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "[copiaModel] Error obteniendo copias disponibles por libro:",
      error,
    );
    throw error;
  }

  return (data ?? []).map((c) => c.id);
}

export async function countAvailableCopiasByLibro(
  id_libro: string,
): Promise<number> {
  const adminClient = createAdminClient();

  const { count, error } = await adminClient
    .from("copia")
    .select("id", { count: "exact", head: true })
    .eq("id_libro", id_libro)
    .eq("estado", "disponible")
    .is("deleted_at", null);

  if (error) {
    console.error(
      "[copiaModel] Error contando copias disponibles por libro:",
      error,
    );
    throw error;
  }

  return count ?? 0;
}
