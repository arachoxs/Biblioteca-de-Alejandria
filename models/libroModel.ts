import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import type {
  InsertLibroPayload,
  LibroRow,
  LibroWithRelations,
  UpdateLibroPayload,
} from "@/lib/types/libro";
import type { Paginated } from "@/lib/types/common";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";
import {
  buildOrILikeFilter,
  escapeLikePattern,
  formatILIKE,
} from "@/lib/validations/db-utils";
import type { CondicionLibro } from "@/lib/types/libro";

type LibroUpdateRow = Database["public"]["Tables"]["libro"]["Update"];

function buildLibroUpdatePayload(
  input: UpdateLibroPayload,
): Partial<LibroUpdateRow> {
  const { sinopsis, ...rest } = input;
  const entries = Object.entries(rest).filter(([, v]) => v !== undefined);
  const payload = Object.fromEntries(entries) as Partial<LibroUpdateRow>;
  if (sinopsis !== undefined) payload.sipnosis = sinopsis;
  return payload;
}

function extractRelationName(value: unknown): string | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const first = value[0] as { nombre?: unknown } | undefined;
    return typeof first?.nombre === "string" ? first.nombre : null;
  }

  if (typeof value === "object") {
    const relation = value as { nombre?: unknown };
    return typeof relation.nombre === "string" ? relation.nombre : null;
  }

  return null;
}

function normalizeLibroWithRelations(
  row: LibroRow & Record<string, unknown>,
): LibroWithRelations {
  const { autor, categoria, ...libro } = row;

  return {
    ...(libro as LibroRow),
    autor_nombre: extractRelationName(autor),
    categoria_nombre: extractRelationName(categoria),
  };
}

function extractCopiasCount(row: Record<string, unknown>): number {
  const rowCopia = row.copia as { count: number } | { count: number }[] | undefined;
  const count = Array.isArray(rowCopia) ? rowCopia[0]?.count : rowCopia?.count;
  return Number(count) || 0;
}

interface LibrosQueryParams<T> {
  page: number;
  pageSize: number;
  searchTerm?: string;
  selectClause: string;
  normalize: (row: Record<string, unknown>) => T;
}

async function queryLibrosBase<T>(params: LibrosQueryParams<T>): Promise<Paginated<T>> {
  const { page, pageSize, searchTerm, selectClause, normalize } = params;
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("libro")
    .select(selectClause, { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("id", { ascending: false });

  const normalizedSearch = searchTerm?.trim();

  if (normalizedSearch) {
    const [authorIds, categoryIds] = await Promise.all([
      getMatchingIds("autor", normalizedSearch),
      getMatchingIds("categoria", normalizedSearch),
    ]);

    let orFilter = buildOrILikeFilter(
      ["titulo", "isbn", "idioma", "editorial"],
      normalizedSearch,
    );

    if (authorIds.length > 0) {
      orFilter += `,id_autor.in.(${authorIds.join(",")})`;
    }

    if (categoryIds.length > 0) {
      orFilter += `,id_categoria.in.(${categoryIds.join(",")})`;
    }

    query = query.or(orFilter);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[libroModel] Error al obtener libros:", error);
    throw error;
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const normalized = rows.map((row) => normalize(row));
  const totalCount = count ?? 0;

  return {
    data: normalized,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

async function getMatchingIds(
  table: "autor" | "categoria",
  searchTerm: string,
): Promise<number[]> {
  const adminClient = createAdminClient();
  const pattern = formatILIKE(searchTerm);

  const { data, error } = await adminClient
    .from(table)
    .select("id")
    .ilike("nombre", pattern);

  if (error) {
    console.error(`[libroModel] Error al buscar ${table} por termino:`, error);
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

/**
 * Inserta un nuevo libro en la tabla `libro`.
 */
export async function createLibro(
  input: InsertLibroPayload,
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .insert({
      titulo: input.titulo,
      isbn: input.isbn,
      idioma: input.idioma,
      sipnosis: input.sinopsis,
      paginas: input.paginas,
      precio: input.precio,
      estado: input.estado,
      id_autor: input.id_autor,
      id_categoria: input.id_categoria,
      fecha_publicacion: input.fecha_publicacion,
      editorial: input.editorial,
      id_modeloRA: input.id_modeloRA ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[libroModel] Error al crear libro:", error);
    throw error;
  }

  return data.id;
}

/**
 * Obtiene libros activos paginados.
 * Incluye nombres de autor y categoria para listados.
 */
export async function getLibros(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
  withCopies: boolean = false,
): Promise<Paginated<LibroWithRelations>> {
  const selectClause = withCopies
    ? "*, autor(nombre), categoria(nombre), copia!left(count)"
    : "*, autor(nombre), categoria(nombre)";

  return queryLibrosBase({
    page,
    pageSize,
    searchTerm,
    selectClause,
    normalize: (row) => {
      const base = normalizeLibroWithRelations(row as LibroRow & Record<string, unknown>);
      return withCopies ? { ...base, copias_count: extractCopiasCount(row) } : base;
    },
  });
}

/**
 * Obtiene un libro activo por ID con datos de autor y categoria.
 */
export async function getActiveLibroById(
  libroId: string,
): Promise<LibroWithRelations | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .select("*, autor(nombre), categoria(nombre)")
    .eq("id", libroId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[libroModel] Error al obtener libro por ID:", error);
    throw error;
  }

  if (!data) return null;

  return normalizeLibroWithRelations(data as LibroRow & Record<string, unknown>);
}

/**
 * Actualiza un libro activo por su ID.
 */
export async function updateLibroById(
  libroId: string,
  input: UpdateLibroPayload,
): Promise<void> {
  const adminClient = createAdminClient();

  const payload = buildLibroUpdatePayload(input);

  if (Object.keys(payload).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar.");
  }

  const { data, error } = await adminClient
    .from("libro")
    .update(payload)
    .eq("id", libroId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[libroModel] Error al actualizar libro:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Libro no encontrado.");
  }
}

/**
 * Realiza eliminacion logica de un libro activo por su ID.
 */
export async function softDeleteLibroById(libroId: string): Promise<void> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", libroId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[libroModel] Error al eliminar libro:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Libro no encontrado.");
  }
}

/**
 * Verifica si ya existe un libro activo con el mismo ISBN.
 * Permite excluir un ID (util para edicion).
 */
export async function checkLibroExistsByIsbn(
  isbn: string,
  excludeId?: string,
): Promise<boolean> {
  const adminClient = createAdminClient();
  const escapedIsbn = escapeLikePattern(isbn.trim());

  let query = adminClient
    .from("libro")
    .select("id")
    .is("deleted_at", null)
    .ilike("isbn", escapedIsbn);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error("[libroModel] Error al verificar ISBN duplicado:", error);
    throw error;
  }

  return !!data;
}

/**
 * Verifica si ya existe un libro activo con el mismo título, ISBN y estado.
 * Permite excluir un ID (útil para edición).
 */
export async function checkLibroDuplicateInfo(
  titulo: string,
  isbn: string,
  estado: CondicionLibro,
  excludeId?: string,
): Promise<boolean> {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("libro")
    .select("id")
    .is("deleted_at", null)
    .ilike("titulo", escapeLikePattern(titulo.trim()))
    .ilike("isbn", escapeLikePattern(isbn.trim()))
    .eq("estado", estado);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error("[libroModel] Error al verificar duplicado de info:", error);
    throw error;
  }

  return !!data;
}

/**
 * Rollback (Hard Delete) de un libro y sus dependencias creadas en transacciones fallidas.
 * Se eliminan primero copias, historico, noticias, luego el libro y finalmente el modelo RA.
 */
async function deleteByLibroId(
  table: "copia" | "historico" | "noticias",
  id_libro: string,
): Promise<void> {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from(table)
    .delete()
    .eq("id_libro", id_libro);
  if (error) {
    console.error(`[libroModel] Error eliminando ${table} en rollback:`, error);
  }
}

export async function rollbackLibro(id_libro: string): Promise<void> {
  await deleteByLibroId("copia", id_libro);
  await deleteByLibroId("historico", id_libro);
  await deleteByLibroId("noticias", id_libro);

  const adminClient = createAdminClient();

  const { data: libroData } = await adminClient
    .from("libro")
    .select("id_modeloRA")
    .eq("id", id_libro)
    .maybeSingle();

  const modeloRAId = (libroData as Record<string, unknown> | null)?.id_modeloRA as number | null;

  const { error: libroErr } = await adminClient
    .from("libro")
    .delete()
    .eq("id", id_libro);

  if (libroErr) {
    console.error("[libroModel] Error eliminando libro principal en rollback:", libroErr);
    throw libroErr;
  }

  if (modeloRAId) {
    const { error: modeloErr } = await adminClient
      .from("modelo_ra")
      .delete()
      .eq("id", modeloRAId);
    if (modeloErr) {
      console.error("[libroModel] Error eliminando modelo_ra en rollback:", modeloErr);
    }
  }
}
