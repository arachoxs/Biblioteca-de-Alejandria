import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  CopiaRow,
  InsertCopiaPayload,
  UpdateCopiaPayload,
} from "@/lib/types/copia";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Escritura ─────────────────────────────────────────────────────

export async function insertCopia(
  data: InsertCopiaPayload
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("copia").insert({
    id_libro: data.id_libro,
    id_tienda: data.id_tienda,
    estado: data.estado,
  });

  if (error) {
    console.error("[copiaModel] Error insertando copia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateCopia(
  id: string,
  data: UpdateCopiaPayload
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

export async function softDeleteCopia(id: string): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("copia")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[copiaModel] Error eliminando copia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Lectura ───────────────────────────────────────────────────────

export async function getCopiaById(
  id: string
): Promise<CopiaRow | null> {
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

export async function getCopias(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  id_tienda?: string
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
    .order("created_at", { ascending: false });

  if (id_tienda) {
    query = query.eq("id_tienda", id_tienda);
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
