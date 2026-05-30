import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type {
  LibroRecomendacionBusqueda,
  LibroRecomendacionItem,
  VistaLibroRecomendacionRow,
} from "@/lib/types/libroRecomendacion";
import { formatILIKE, quotePostgrestFilterValue } from "@/lib/validations/db-utils";

const RECOMENDACION_PAGE_SIZE = 20;
const RECOMENDACION_MAX_PAGE_SIZE = 50;

function normalizeRow(
  row: VistaLibroRecomendacionRow,
): LibroRecomendacionItem {
  return {
    libro_id: row.libro_id!,
    titulo: row.titulo!,
    isbn: row.isbn!,
    idioma: row.idioma!,
    sipnosis: row.sipnosis!,
    paginas: row.paginas!,
    precio: row.precio!,
    condicion_libro: row.condicion_libro!,
    editorial: row.editorial!,
    fecha_publicacion: row.fecha_publicacion!,
    ano_publicacion: row.ano_publicacion,
    autor_id: row.autor_id!,
    autor_nombre: row.autor_nombre!,
    autor_nacionalidad: row.autor_nacionalidad,
    categoria_id: row.categoria_id!,
    categoria_nombre: row.categoria_nombre!,
    categoria_descripcion: row.categoria_descripcion,
    copias_disponibles: row.copias_disponibles!,
    copias_reservadas: row.copias_reservadas!,
    copias_vendidas: row.copias_vendidas!,
  };
}

function applyRecomendacionFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: LibroRecomendacionBusqueda,
) {
  if (filters.termino) {
    const pattern = quotePostgrestFilterValue(formatILIKE(filters.termino));
    query = query.or(`titulo.ilike.${pattern},isbn.ilike.${pattern}`);
  }

  if (filters.categoria_id !== undefined) {
    query = query.eq("categoria_id", filters.categoria_id);
  }

  if (filters.autor_id !== undefined) {
    query = query.eq("autor_id", filters.autor_id);
  }

  if (filters.idioma) {
    query = query.eq("idioma", filters.idioma);
  }

  return query;
}

/**
 * Obtiene libros paginados para el agente de recomendación.
 * Solo retorna libros con copias disponibles (> 0).
 */
export async function getLibrosRecomendacion(
  page: number = 1,
  pageSize: number = RECOMENDACION_PAGE_SIZE,
  filters: LibroRecomendacionBusqueda = {},
): Promise<Paginated<LibroRecomendacionItem>> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(
    Math.max(1, pageSize),
    RECOMENDACION_MAX_PAGE_SIZE,
  );
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const adminClient = createAdminClient();
  let query = adminClient
    .from("vista_libros_recomendacion")
    .select("*", { count: "exact" });

  query = applyRecomendacionFilters(query, filters);

  const { data, error, count } = await query
    .order("copias_disponibles", { ascending: false })
    .order("titulo", { ascending: true })
    .range(from, to);

  if (error) {
    console.error(
      "[libroRecomendacionModel] Error al obtener libros de recomendación:",
      error,
    );
    throw error;
  }

  const totalCount = count ?? 0;

  return {
    data: (data ?? []).map(normalizeRow),
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

/**
 * Obtiene un libro por ID para recomendación.
 * Retorna null si no existe o no tiene copias disponibles.
 */
export async function getLibroRecomendacionById(
  id: string,
): Promise<LibroRecomendacionItem | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("vista_libros_recomendacion")
    .select("*")
    .eq("libro_id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "[libroRecomendacionModel] Error al obtener libro por ID:",
      error,
    );
    throw error;
  }

  return data ? normalizeRow(data) : null;
}

/**
 * Cuenta libros que cumplen los filtros sin traer datos.
 * Útil para que el agente sepa cuántos resultados existen antes de paginar.
 */
export async function countLibrosRecomendacion(
  filters: LibroRecomendacionBusqueda = {},
): Promise<number> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("vista_libros_recomendacion")
    .select("*", { count: "exact", head: true });

  query = applyRecomendacionFilters(query, filters);

  const { count, error } = await query;

  if (error) {
    console.error(
      "[libroRecomendacionModel] Error al contar libros de recomendación:",
      error,
    );
    throw error;
  }

  return count ?? 0;
}
