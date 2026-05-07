import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  CopiaRow,
  InsertCopiaPayload,
  TransferCopiasByQuantityInput,
  UpdateCopiaPayload,
} from "@/lib/types/copia";
import type {
  InventarioCopiaDetalle,
  VistaInventarioRow,
} from "@/lib/types/inventario";
import { buildOrILikeFilter } from "@/lib/validations/db-utils";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

export type TransferCopiasByQuantityErrorCode =
  | "INSUFFICIENT_STOCK"
  | "ROLLBACK_FAILED";

export interface TransferCopiasByQuantityModelResult extends ModelResult {
  transferredIds?: string[];
  errorCode?: TransferCopiasByQuantityErrorCode;
}

export async function insertCopias(
  data: InsertCopiaPayload[],
): Promise<ModelResult> {
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
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateCopia(
  id: string,
  data: UpdateCopiaPayload,
): Promise<ModelResult> {
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
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function transferCopias(
  ids: string[],
  id_tienda: string,
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { data: updatedRows, error } = await adminClient
    .from("copia")
    .update({ id_tienda })
    .in("id", ids)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[copiaModel] Error trasladando copias:", error);
    return { success: false, error: error.message };
  }

  if ((updatedRows ?? []).length !== ids.length) {
    return {
      success: false,
      error: "No se pudieron trasladar todas las copias solicitadas.",
    };
  }

  return { success: true };
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

export async function transferCopiasByQuantityAtomic(
  input: TransferCopiasByQuantityInput,
): Promise<TransferCopiasByQuantityModelResult> {
  const adminClient = createAdminClient();
  const safeQuantity = Math.max(1, input.cantidad);

  const copiasForTransfer = await getCopiasForTransferByQuantity(
    input.id_libro,
    input.id_tienda_origen,
    safeQuantity,
  );

  if (copiasForTransfer.length === 0) {
    return {
      success: false,
      errorCode: "INSUFFICIENT_STOCK",
      error:
        "No hay copias disponibles en la tienda origen para el libro especificado.",
    };
  }

  // PASO 2: Actualizar solo esos IDs específicos
  const { data: updatedRows, error: updateError } = await adminClient
    .from("copia")
    .update({ id_tienda: input.id_tienda_destino })
    .in("id", copiasForTransfer) // Usamos .in() para afectar solo a los que encontramos
    .select("id");

  if (updateError) throw updateError;

  const transferredIds = (updatedRows ?? []).map((row) => row.id);
  if (transferredIds.length === safeQuantity) {
    return { success: true, transferredIds };
  }

  if (transferredIds.length > 0) {
    rollbackTransferByQuantity(transferredIds, input.id_tienda_origen).catch(
      (rollbackError) => {
        console.error(
          "[copiaModel] Error durante el rollback de traslado por cantidad después de una actualización parcial:",
          rollbackError,
        );
      },
    );
  }

  return {
    success: false,
    errorCode: "INSUFFICIENT_STOCK",
    error:
      "No hay suficientes copias disponibles en la tienda origen para completar el traslado.",
  };
}

export async function softDeleteCopias(ids: string[]): Promise<ModelResult> {
  // Usamos el Admin Client para asegurar permisos de escritura
  const adminClient = createAdminClient();

  const { data: updatedRows, error } = await adminClient
    .from("copia") // Asegúrate de que sea "copia" (singular) como en tu otra función
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids)
    .is("deleted_at", null)
    .select("id"); // Solo actualiza las que no estén ya borradas

  if (error) {
    console.error("[copiaModel] Error en softDeleteManyCopiasModel:", error);
    return { success: false, error: error.message };
  }

  if ((updatedRows ?? []).length !== ids.length) {
    return {
      success: false,
      error: "No se pudieron eliminar todas las copias solicitadas.",
    };
  }
  return { success: true };
}
// ─── Lectura ───────────────────────────────────────────────────────

function getRelationName(
  value: { nombre?: string } | { nombre?: string }[] | null,
): string {
  if (!value) return "Sin tienda asociada";
  if (Array.isArray(value)) return value[0]?.nombre ?? "Sin tienda asociada";
  return value.nombre ?? "Sin tienda asociada";
}

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

export async function getInventarioRows(
  searchTerm?: string,
  id_tienda?: string,
): Promise<VistaInventarioRow[]> {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("vista_inventario")
    .select("*")
    .order("titulo", { ascending: true, nullsFirst: false });

  if (id_tienda) {
    query = query.eq("tienda_id", id_tienda);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    query = query.or(
      buildOrILikeFilter(["titulo", "autor_libro", "isbn"], searchTerm),
    );
  }

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

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("copia")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("id", { ascending: false });

  if (id_tienda) {
    query = query.eq("id_tienda", id_tienda);
  }

  if (id_libro) {
    query = query.eq("id_libro", id_libro);
  }

  if (searchTerm && searchTerm.trim() !== "") {
    query = query.ilike("codigo_seq", `%${searchTerm.trim()}%`);
  }

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
