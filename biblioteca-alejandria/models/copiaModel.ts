import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  CopiaRow,
  InsertCopiaPayload,
  UpdateCopiaPayload,
} from "@/lib/types/copia";
import type {
  InventarioCopiaDetalle,
  VistaInventarioRow,
} from "@/lib/types/inventario";
import { buildOrILikeFilter } from "@/lib/validations/db-utils";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

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

  return data ?? [];
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
    // Si la tabla copia tiene uuid, busqueda por uuid exacto
    // asumiendo uuid
    query = query.eq("id", searchTerm.trim());
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
