import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import type {
  InsertLibroPayload,
  LibroRow,
  LibroWithRelations,
  UpdateLibroPayload,
} from "@/lib/types/libro";
import type { ModelResult, Paginated } from "@/lib/types/common";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";
import {
  buildOrILikeFilter,
  escapeLikePattern,
  formatILIKE,
} from "@/lib/validations/db-utils";

type LibroUpdateRow = Database["public"]["Tables"]["libro"]["Update"];
type LibroId = Database["public"]["Tables"]["libro"]["Row"]["id"];
type LibroModelResultWithId = ModelResult & { id?: LibroId };

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

async function getMatchingAuthorIds(searchTerm: string): Promise<number[]> {
  const adminClient = createAdminClient();
  const pattern = formatILIKE(searchTerm);

  const { data, error } = await adminClient
    .from("autor")
    .select("id")
    .ilike("nombre", pattern);

  if (error) {
    console.error("[libroModel] Error al buscar autores por termino:", error);
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

async function getMatchingCategoryIds(searchTerm: string): Promise<number[]> {
  const adminClient = createAdminClient();
  const pattern = formatILIKE(searchTerm);

  const { data, error } = await adminClient
    .from("categoria")
    .select("id")
    .ilike("nombre", pattern);

  if (error) {
    console.error("[libroModel] Error al buscar categorias por termino:", error);
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

/**
 * Inserta un nuevo libro en la tabla `libro`.
 */
export async function createLibro(
  input: InsertLibroPayload,
): Promise<LibroModelResultWithId> {
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
      ano_publicacion: input.ano_publicacion,
      estado: input.estado,
      id_autor: input.id_autor,
      id_categoria: input.id_categoria,
      fecha_publicacion: input.fecha_publicacion ?? null,
      editorial: input.editorial ?? null,
      id_modeloRA: input.id_modeloRA ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[libroModel] Error al crear libro:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * Obtiene libros activos paginados.
 * Incluye nombres de autor y categoria para listados.
 */
export async function getLibros(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<Paginated<LibroWithRelations>> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("libro")
    .select("*, autor(nombre), categoria(nombre)", { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("id", { ascending: false });

  const normalizedSearch = searchTerm?.trim();

  if (normalizedSearch) {
    const [authorIds, categoryIds] = await Promise.all([
      getMatchingAuthorIds(normalizedSearch),
      getMatchingCategoryIds(normalizedSearch),
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

  const normalized = (data ?? []).map((row) =>
    normalizeLibroWithRelations(row as LibroRow & Record<string, unknown>),
  );
  const totalCount = count ?? 0;

  return {
    data: normalized,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
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
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const payload: LibroUpdateRow = {
    ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
    ...(input.isbn !== undefined ? { isbn: input.isbn } : {}),
    ...(input.idioma !== undefined ? { idioma: input.idioma } : {}),
    ...(input.sinopsis !== undefined ? { sipnosis: input.sinopsis } : {}),
    ...(input.paginas !== undefined ? { paginas: input.paginas } : {}),
    ...(input.precio !== undefined ? { precio: input.precio } : {}),
    ...(input.ano_publicacion !== undefined
      ? { ano_publicacion: input.ano_publicacion }
      : {}),
    ...(input.estado !== undefined ? { estado: input.estado } : {}),
    ...(input.id_autor !== undefined ? { id_autor: input.id_autor } : {}),
    ...(input.id_categoria !== undefined ? { id_categoria: input.id_categoria } : {}),
    ...(input.fecha_publicacion !== undefined
      ? { fecha_publicacion: input.fecha_publicacion }
      : {}),
    ...(input.editorial !== undefined ? { editorial: input.editorial } : {}),
    ...(input.id_modeloRA !== undefined ? { id_modeloRA: input.id_modeloRA } : {}),
  };

  if (Object.keys(payload).length === 0) {
    return {
      success: false,
      error: "Debes enviar al menos un campo para actualizar.",
    };
  }

  const { data, error } = await adminClient
    .from("libro")
    .update(payload)
    .eq("id", libroId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("[libroModel] Error al actualizar libro:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Libro no encontrado." };
  }

  return { success: true };
}

/**
 * Realiza eliminacion logica de un libro activo por su ID.
 */
export async function softDeleteLibroById(libroId: string): Promise<ModelResult> {
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
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Libro no encontrado." };
  }

  return { success: true };
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

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[libroModel] Error al verificar ISBN duplicado:", error);
    throw error;
  }

  return !!data;
}
