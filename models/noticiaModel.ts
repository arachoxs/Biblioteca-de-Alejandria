import { createAdminClient, createPublicClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type {
  NoticiaId,
  LibroId,
  SearchTerm,
  NoticiaWithLibro,
  NoticiaWithLibroCompleto,
  InsertNoticiaPayload,
  UpdateNoticiaPayload,
  NoticiaRow,
  NoticiaFilters,
} from "@/lib/types/noticia";
import { buildSafePagination, normalizePagination } from "@/lib/pagination";
import { formatILIKE, quotePostgrestFilterValue } from "@/lib/validations/db-utils";

interface NoticiaBaseRow {
  id: string;
  id_libro: string;
  fecha_publicacion: string;
  fecha_expiracion: string;
  es_visible: boolean;
  deleted_at: string | null;
  imagenes: string[] | null;
}

interface NoticiaConLibroTitulo extends NoticiaBaseRow {
  libro: { titulo: string | null } | null;
}

interface NoticiaConLibroCompleto extends NoticiaBaseRow {
  imagenes: string[] | null;
  libro: { titulo: string | null; precio: number | null; autor: { nombre: string | null } | null } | null;
}

function mapNoticiaBase(row: NoticiaBaseRow) {
  return {
    id: row.id,
    id_libro: row.id_libro,
    fecha_publicacion: row.fecha_publicacion,
    fecha_expiracion: row.fecha_expiracion,
    es_visible: row.es_visible,
    deleted_at: row.deleted_at,
    imagenes: row.imagenes,
  };
}

function mapNoticiaConLibro(row: NoticiaConLibroTitulo): NoticiaWithLibro {
  return {
    ...mapNoticiaBase(row),
    libro_titulo: row.libro?.titulo ?? null,
  };
}

function mapNoticiaConLibroCompleto(row: NoticiaConLibroCompleto): NoticiaWithLibroCompleto {
  return {
    ...mapNoticiaBase(row),
    libro_titulo: row.libro?.titulo ?? null,
    precio: row.libro?.precio ?? 0,
    imagenes: row.imagenes ?? null,
    autor_nombre: row.libro?.autor?.nombre ?? null,
  };
}

export async function insertNoticia(
  data: InsertNoticiaPayload
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("noticias").insert({
    id_libro: data.id_libro,
    fecha_publicacion: data.fecha_publicacion,
    fecha_expiracion: data.fecha_expiracion,
    es_visible: data.es_visible,
    imagenes: data.imagenes ?? [],
  });

  if (error) {
    console.error("[noticiaModel] Error insertando noticia:", error);
    throw error;
  }
}

export async function updateNoticia(
  id: NoticiaId,
  data: UpdateNoticiaPayload
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("noticias")
    .update({
      fecha_publicacion: data.fecha_publicacion,
      fecha_expiracion: data.fecha_expiracion,
      es_visible: data.es_visible,
      imagenes: data.imagenes,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[noticiaModel] Error actualizando noticia:", error);
    throw error;
  }
}

export async function softDeleteNoticia(id: NoticiaId): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("noticias")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[noticiaModel] Error eliminando noticia:", error);
    throw error;
  }
}

export async function softDeleteNoticiaByLibroId(id_libro: LibroId): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("noticias")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id_libro", id_libro)
    .is("deleted_at", null);

  if (error) {
    console.error("[noticiaModel] Error eliminando noticia por id_libro:", error);
    throw error;
  }
}

export async function getNoticiaById(
  id: NoticiaId
): Promise<NoticiaRow | null> {
  const publicClient = createPublicClient();

  const { data, error } = await publicClient
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
  libroId: LibroId
): Promise<NoticiaRow | null> {
  const publicClient = createPublicClient();

  const { data, error } = await publicClient
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
  searchTerm?: SearchTerm
): Promise<Paginated<NoticiaWithLibro>> {
  const publicClient = createPublicClient();

  const { safePage, safePageSize, from, to } = buildSafePagination(page, pageSize);

  let query = publicClient
    .from("noticias")
    .select("*, libro!inner(titulo)", { count: "exact" })
    .is("deleted_at", null)
    .range(from, to)
    .order("fecha_publicacion", { ascending: false });

  if (searchTerm && searchTerm.trim() !== "") {
    query = query.ilike("libro.titulo", formatILIKE(searchTerm));
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[noticiaModel] Error listando noticias:", error);
    throw error;
  }

  const normalized: NoticiaWithLibro[] = (data as NoticiaConLibroTitulo[] | null)?.map(mapNoticiaConLibro) ?? [];

  return normalizePagination(normalized, count ?? 0, safePage, safePageSize);
}

export async function getNoticiasWithLibroCompleto(
  page: number = 1,
  pageSize: number = 20
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const publicClient = createPublicClient();

  const { safePage, safePageSize, from, to } = buildSafePagination(page, pageSize);

  const { data, error, count } = await publicClient
    .from("vista_noticias_completa")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .eq("es_visible", true)
    .gt("fecha_expiracion", new Date().toISOString())
    .gt("stock_disponible", 0)
    .range(from, to)
    .order("fecha_publicacion", { ascending: false });

  if (error) {
    console.error("[noticiaModel] Error listando noticias con precio:", error);
    throw error;
  }

  const normalized: NoticiaWithLibroCompleto[] = (data as unknown as VistaNoticiaCompleta[] | null)?.map(mapVistaToNoticiaWithLibroCompleto) ?? [];

  return normalizePagination(normalized, count ?? 0, safePage, safePageSize);
}

interface VistaNoticiaCompleta {
  id: string;
  id_libro: string;
  fecha_publicacion: string;
  fecha_expiracion: string;
  es_visible: boolean;
  deleted_at: string | null;
  imagenes: string[] | null;
  titulo: string | null;
  isbn: string | null;
  precio: number | null;
  idioma: string | null;
  editorial: string | null;
  estado: string | null;
  ano_publicacion: number | null;
  autor_id: number | null;
  autor_nombre: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
  paginas: number | null;
  stock_disponible: number | null;
  sipnosis: string | null;
}

function mapVistaToNoticiaWithLibroCompleto(row: VistaNoticiaCompleta): NoticiaWithLibroCompleto {
  return {
    id: row.id,
    id_libro: row.id_libro,
    fecha_publicacion: row.fecha_publicacion,
    fecha_expiracion: row.fecha_expiracion,
    es_visible: row.es_visible,
    deleted_at: row.deleted_at,
    imagenes: row.imagenes,
    libro_titulo: row.titulo,
    precio: row.precio ?? 0,
    autor_nombre: row.autor_nombre,
    isbn: row.isbn,
    paginas: row.paginas,
    idioma: row.idioma,
    editorial: row.editorial,
    estado: row.estado,
    ano_publicacion: row.ano_publicacion,
    categoria_nombre: row.categoria_nombre,
    stock_disponible: row.stock_disponible,
    sinopsis: row.sipnosis,
  };
}

function applyNoticiaFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: NoticiaFilters
): typeof query {
  const { searchTerm, autor, categoria, ano_publicacion, idioma, editorial, estado, precioMin, precioMax } = filters;

  if (searchTerm?.trim()) {
    const pattern = quotePostgrestFilterValue(formatILIKE(searchTerm));
    query = query.or(`titulo.ilike.${pattern},isbn.ilike.${pattern},autor_nombre.ilike.${pattern}`);
  }
  if (autor?.trim()) {
    query = query.ilike("autor_nombre", formatILIKE(autor));
  }
  if (categoria?.trim()) {
    query = query.ilike("categoria_nombre", formatILIKE(categoria));
  }
  if (ano_publicacion !== undefined) {
    query = query.eq("ano_publicacion", ano_publicacion);
  }
  if (idioma?.trim()) {
    query = query.eq("idioma", idioma);
  }
  if (editorial?.trim()) {
    query = query.eq("editorial", editorial);
  }
  if (estado) {
    query = query.eq("estado", estado);
  }
  if (precioMin !== undefined) {
    query = query.gte("precio", precioMin);
  }
  if (precioMax !== undefined) {
    query = query.lte("precio", precioMax);
  }

  return query;
}

export async function getAllNoticiasWithLibroCompleto(
  page: number = 1,
  pageSize: number = 20,
  filters?: NoticiaFilters
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const publicClient = createPublicClient();

  const { safePage, safePageSize, from, to } = buildSafePagination(page, pageSize);

  let query = publicClient
    .from("vista_noticias_completa")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .eq("es_visible", true)
    .gt("stock_disponible", 0)
    .range(from, to)
    .order("fecha_publicacion", { ascending: false });

  if (filters) {
    query = applyNoticiaFilters(query, filters);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[noticiaModel] Error listando noticias con filtros:", error);
    throw error;
  }

  const normalized: NoticiaWithLibroCompleto[] = (data as unknown as VistaNoticiaCompleta[] | null)?.map(mapVistaToNoticiaWithLibroCompleto) ?? [];

  return normalizePagination(normalized, count ?? 0, safePage, safePageSize);
}

export async function getNoticiaCompletaById(
  id: NoticiaId
): Promise<NoticiaWithLibroCompleto | null> {
  const publicClient = createPublicClient();

  const { data, error } = await publicClient
    .from("vista_noticias_completa")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[noticiaModel] Error obteniendo noticia completa por id:", error);
    throw error;
  }

  if (!data) return null;

  return mapVistaToNoticiaWithLibroCompleto(data as unknown as VistaNoticiaCompleta);
}
