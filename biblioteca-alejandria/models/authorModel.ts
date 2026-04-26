import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, Paginated } from "@/lib/types/common";
import type {
  AuthorWithBookCount,
  InsertAuthorPayload,
  UpdateAuthorPayload,
} from "@/lib/types/author";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";
import { buildOrILikeFilter, escapeLikePattern } from "@/lib/validations/db-utils";

// ─── Constantes ────────────────────────────────────────────────────

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Inserta un nuevo autor en la tabla `autor`.
 */
export async function insertAuthor(
  data: InsertAuthorPayload
): Promise<ModelResult & { id?: number }> {
  const adminClient = createAdminClient();

  const { data: resultData, error } = await adminClient.from("autor").insert({
    nombre: data.nombre,
    nacionalidad: data.nacionalidad,
    fecha_nacimiento: data.fecha_nacimiento,
  }).select("id").single();

  if (error) {
    console.error("[authorModel] Error al insertar autor:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: resultData?.id };
}

/**
 * Actualiza los datos de un autor existente.
 */
export async function updateAuthor(
  id: number,
  data: UpdateAuthorPayload
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("autor")
    .update({
      nombre: data.nombre,
      nacionalidad: data.nacionalidad,
      fecha_nacimiento: data.fecha_nacimiento,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[authorModel] Error al actualizar autor:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Borrado lógico: marca `deleted_at` con la fecha actual.
 * Nunca ejecuta `.delete()` físico.
 */
export async function deleteAuthor(id: number): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("autor")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[authorModel] Error al eliminar autor:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene los autores activos (deleted_at IS NULL) paginados y filtrados.
 *
 * Usa la sintaxis relacional de PostgREST para contar libros.
 * pageSize está limitado a MAX_PAGE_SIZE para prevenir abuso de recursos.
 */
export async function getAuthors(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<Paginated<AuthorWithBookCount>> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("autor")
    .select("*, libro(count)", { count: "exact" })
    .is("deleted_at", null)
    .is("libro.deleted_at", null)
    .range(from, to)
    .order("nombre", { ascending: true });

  if (searchTerm && searchTerm.trim() !== "") {
    query = query.or(buildOrILikeFilter(["nombre", "nacionalidad"], searchTerm));
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[authorModel] Error al obtener autores:", error);
    throw error;
  }

  // PostgREST devuelve `libro: [{ count: N }]` — normalizar a un número plano.
  const normalized: AuthorWithBookCount[] = (data || []).map((row) => {
    const libroArr = (row as Record<string, unknown>).libro as
      | { count: number }[]
      | undefined;

    return {
      id: row.id,
      nombre: row.nombre,
      nacionalidad: row.nacionalidad,
      fecha_nacimiento: row.fecha_nacimiento,
      deleted_at: row.deleted_at,
      libro_count: libroArr?.[0]?.count ?? 0,
    };
  });

  const totalCount = count || 0;

  return {
    data: normalized,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

// ─── Validación de unicidad ────────────────────────────────────────

/**
 * Verifica si ya existe un autor activo con el mismo nombre y nacionalidad.
 * Escapa wildcards para que el match sea exacto, no por patrón.
 * Opcionalmente excluye un ID (útil al editar para no compararse consigo mismo).
 */
export async function checkAuthorExists(
  nombre: string,
  nacionalidad: string,
  excludeId?: number
): Promise<boolean> {
  const adminClient = createAdminClient();

  const escapedNombre = escapeLikePattern(nombre.trim());
  const escapedNacionalidad = escapeLikePattern(nacionalidad.trim());

  let query = adminClient
    .from("autor")
    .select("id")
    .ilike("nombre", escapedNombre)
    .ilike("nacionalidad", escapedNacionalidad)
    .is("deleted_at", null);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[authorModel] Error al verificar existencia de autor:", error);
    throw error;
  }

  return !!data;
}

/**
 * Retorna la cantidad de libros activos asociados a un autor.
 * Usado por el servicio para prevenir borrados con dependencias.
 */
export async function getAuthorBookCount(id: number): Promise<number> {
  const adminClient = createAdminClient();

  const { count, error } = await adminClient
    .from("libro")
    .select("id", { count: "exact", head: true })
    .eq("id_autor", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[authorModel] Error al contar libros de autor:", error);
    throw error;
  }

  return count ?? 0;
}
