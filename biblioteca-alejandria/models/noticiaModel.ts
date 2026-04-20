import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  NoticiaWithLibro,
  InsertNoticiaPayload,
  UpdateNoticiaPayload,
  NoticiaRow,
} from "@/lib/types/noticia";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";
import { escapeLikePattern } from "@/lib/validations/db-utils";

// ─── Escritura ─────────────────────────────────────────────────────

export async function insertNoticia(
  data: InsertNoticiaPayload
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("noticias").insert({
    id_libro: data.id_libro,
    fecha_publicacion: data.fecha_publicacion,
    fecha_expiracion: data.fecha_expiracion,
    es_visible: data.es_visible,
  });

  if (error) {
    console.error("[noticiaModel] Error insertando noticia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateNoticia(
  id: string,
  data: UpdateNoticiaPayload
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("noticias")
    .update({
      fecha_publicacion: data.fecha_publicacion,
      fecha_expiracion: data.fecha_expiracion,
      es_visible: data.es_visible,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[noticiaModel] Error actualizando noticia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function softDeleteNoticia(id: string): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("noticias")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[noticiaModel] Error eliminando noticia:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Lectura ───────────────────────────────────────────────────────

export async function getNoticiaById(
  id: string
): Promise<NoticiaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("noticias")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[noticiaModel] Error obteniendo noticia por id:", error);
    throw error;
  }

  return data;
}

export async function getNoticiaByLibroId(
  libroId: string
): Promise<NoticiaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("noticias")
    .select("*")
    .eq("id_libro", libroId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[noticiaModel] Error obteniendo noticia por id_libro:", error);
    throw error;
  }

  return data;
}

export async function getNoticias(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<Paginated<NoticiaWithLibro>> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("noticias")
    .select("*, libro!inner(titulo)", { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("fecha_publicacion", { ascending: false });

  if (searchTerm && searchTerm.trim() !== "") {
    const escapedSearch = escapeLikePattern(searchTerm.trim());
    query = query.ilike("libro.titulo", `%${escapedSearch}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[noticiaModel] Error listando noticias:", error);
    throw error;
  }

  const normalized: NoticiaWithLibro[] = (data || []).map((row: any) => ({
    id: row.id,
    id_libro: row.id_libro,
    fecha_publicacion: row.fecha_publicacion,
    fecha_expiracion: row.fecha_expiracion,
    es_visible: row.es_visible,
    deleted_at: row.deleted_at,
    libro_titulo: row.libro?.titulo || null,
  }));

  const totalCount = count || 0;

  return {
    data: normalized,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}
