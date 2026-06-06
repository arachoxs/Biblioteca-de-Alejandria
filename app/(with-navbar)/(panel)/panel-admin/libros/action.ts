"use server";

import {
  createBook,
  createBookWithInventory,
  editBook,
  fetchBookHistoricoTimeline,
  removeBook,
  fetchBooks,
} from "@/services/libros/libroService";
import { getActiveLibroById } from "@/models/libroModel";
import { getDefaultTienda } from "@/models/tiendaModel";
import { fetchAuthors } from "@/services/authors/authorService";
import { fetchCategories } from "@/services/categories/categoryService";
import { fetchInventarioStoreOptions } from "@/services/copia/copiaService";
import { validateLibro } from "@/lib/validations/libro";
import {
  isValidUUID,
  sanitizeText,
  toSafePositiveInt,
} from "@/lib/validations/rules";
import {
  getModeloRAByLibroId,
  updateModeloRA,
  uploadAndUpdateTexturas,
} from "@/services/modelo-ra/modeloRAService";
import type {
  InsertLibroPayload,
  LibrosListResponse,
  LibroActionResponse,
  CondicionLibro,
} from "@/lib/types/libro";
import type { ActionResponse } from "@/lib/types/common";
import type { HistoricoTimelineResponse } from "@/lib/types/historico";
import type { ModeloRADataResponse } from "@/lib/types/modelo_ra";
import type { TexturaTipo } from "@/lib/services/ra-storage";

// ─── Lectura ───────────────────────────────────────────────────────

export async function getLibrosAction(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<LibrosListResponse> {
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 10);
  const cleanTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  return await fetchBooks(safePage, safePageSize, cleanTerm || undefined);
}

type OptionsResult = Promise<ActionResponse & { data?: { value: string; label: string }[] }>;

async function fetchOptionsAction(
  fetcher: () => Promise<{ success: boolean; data?: { data: { id: number; nombre: string }[] }; message?: string }>,
  errorMessage: string,
): OptionsResult {
  const result = await fetcher();

  if (!result.success || !result.data) {
    return { success: false, message: result.message || errorMessage };
  }

  return {
    success: true,
    data: result.data.data.map((item) => ({
      value: String(item.id),
      label: item.nombre || "Sin nombre",
    })),
  };
}

export async function getAuthorOptionsAction(): OptionsResult {
  return fetchOptionsAction(
    () => fetchAuthors(1, 100, undefined),
    "Error cargando autores.",
  );
}

export async function getCategoryOptionsAction(): OptionsResult {
  return fetchOptionsAction(
    () => fetchCategories({ page: 1, pageSize: 100, searchTerm: undefined }),
    "Error cargando categorías.",
  );
}

/**
 * Carga tiendas para selector de inventario.
 */
export async function getStoreOptionsAction() {
  return await fetchInventarioStoreOptions();
}

/**
 * Carga un libro activo por ID (para edición).
 */
export async function getLibroByIdAction(id: string) {
  const cleanId = sanitizeText(id);
  if (!cleanId) return null;
  return await getActiveLibroById(cleanId);
}

async function validateUUIDAndFetch<T>(
  rawId: string,
  fetcher: (cleanId: string) => Promise<T>,
  errorMessage: string,
): Promise<{ success: false; errors: Record<string, string> } | { success: true; data: T }> {
  const cleanId = sanitizeText(rawId);
  if (!cleanId || !isValidUUID(cleanId)) {
    return { success: false, errors: { form: errorMessage } };
  }
  const data = await fetcher(cleanId);
  return { success: true, data };
}

export async function getLibroHistoricoTimelineAction(
  libroId: string,
): Promise<HistoricoTimelineResponse> {
  const result = await validateUUIDAndFetch(
    libroId,
    fetchBookHistoricoTimeline,
    "El identificador del libro no es válido.",
  );
  if (!result.success) return result;
  return result.data;
}

export async function getModeloRAByLibroAction(
  libroId: string,
): Promise<ModeloRADataResponse> {
  const result = await validateUUIDAndFetch(
    libroId,
    getModeloRAByLibroId,
    "El identificador del libro no es válido.",
  );
  if (!result.success) return result;
  return result.data;
}

// ─── Mutaciones ────────────────────────────────────────────────────

function sanitizeLibroFormData(formData: Record<string, string>) {
  return {
    titulo: sanitizeText(formData.titulo),
    isbn: sanitizeText(formData.isbn),
    idioma: sanitizeText(formData.idioma),
    sinopsis: sanitizeText(formData.sinopsis),
    paginas: formData.paginas?.trim() ?? "",
    precio: formData.precio?.trim() ?? "",
    estado: formData.estado?.trim() ?? "",
    id_autor: formData.id_autor?.trim() ?? "",
    id_categoria: formData.id_categoria?.trim() ?? "",
    fecha_publicacion: formData.fecha_publicacion?.trim() ?? "",
    editorial: sanitizeText(formData.editorial),
  };
}

function buildLibroPayload(cleaned: ReturnType<typeof sanitizeLibroFormData>): InsertLibroPayload {
  return {
    titulo: cleaned.titulo,
    isbn: cleaned.isbn,
    idioma: cleaned.idioma,
    sinopsis: cleaned.sinopsis,
    paginas: Number(cleaned.paginas),
    precio: Number(cleaned.precio),
    estado: cleaned.estado as CondicionLibro,
    id_autor: Number(cleaned.id_autor),
    id_categoria: Number(cleaned.id_categoria),
    fecha_publicacion: cleaned.fecha_publicacion,
    editorial: cleaned.editorial,
  };
}

async function resolveBodegaYValidarCantidad(
  cantidad: number,
): Promise<{ error?: string; bodegaId?: string }> {
  if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad)) {
    return { error: "La cantidad debe ser un entero válido." };
  }
  if (cantidad < 1 || cantidad > 100) {
    return { error: "La cantidad debe ser entre 1 y 100." };
  }
  const bodega = await getDefaultTienda();
  if (!bodega) {
    return {
      error: "No se encontró la bodega principal. Configura una tienda como bodega.",
    };
  }
  return { bodegaId: bodega.id };
}

export async function crearLibroAction(
  formData: Record<string, string>,
  cantidadInventario?: number,
): Promise<LibroActionResponse> {
  const cleaned = sanitizeLibroFormData(formData);
  const errors = validateLibro(cleaned);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const payload = buildLibroPayload(cleaned);

  if (cantidadInventario !== undefined && cantidadInventario > 0) {
    const result = await resolveBodegaYValidarCantidad(cantidadInventario);
    if (result.error) {
      return { success: false, message: result.error };
    }
    return await createBookWithInventory(payload, result.bodegaId!, cantidadInventario);
  }

  return await createBook(payload);
}

export async function editarLibroAction(
  id: string,
  formData: Record<string, string>,
): Promise<LibroActionResponse> {
  const cleanId = sanitizeText(id);
  if (!cleanId) {
    return { success: false, message: "ID de libro no válido." };
  }

  const cleaned = sanitizeLibroFormData(formData);
  const errors = validateLibro(cleaned);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const payload = buildLibroPayload(cleaned);
  return await editBook(cleanId, payload);
}

export async function eliminarLibroAction(
  id: string,
  titulo: string,
): Promise<LibroActionResponse> {
  const cleanId = sanitizeText(id);
  if (!cleanId) {
    return { success: false, message: "ID de libro no válido." };
  }

  return await removeBook(cleanId, sanitizeText(titulo));
}

function areValidDimensions(...values: number[]): boolean {
  return values.every((v) => Number.isFinite(v));
}

function extractRAFilesFromFormData(formData: FormData): Partial<Record<TexturaTipo, File>> {
  const files: Partial<Record<TexturaTipo, File>> = {};
  const tipos: TexturaTipo[] = ["portada", "contraportada", "lomo"];

  for (const tipo of tipos) {
    const entry = formData.get(`ra_${tipo}`);
    if (entry instanceof File && entry.size > 0) {
      files[tipo] = entry;
    }
  }

  return files;
}

// ─── Modelo RA ─────────────────────────────────────────────────────

/**
 * Actualiza las dimensiones del modelo RA de un libro.
 */
export async function actualizarDimensionesRAAction(
  modeloRAId: number,
  formData: Record<string, string>,
): Promise<ActionResponse> {
  const ancho = Number(formData.ra_ancho);
  const alto = Number(formData.ra_alto);
  const profundidad = Number(formData.ra_profundidad);

  if (!areValidDimensions(ancho, alto, profundidad)) {
    return { success: false, errors: { form: "Las dimensiones deben ser números válidos." } };
  }

  return await updateModeloRA(modeloRAId, {
    dimensiones: { ancho, alto, profundidad },
  });
}

/**
 * Sube texturas (portada, contraportada, lomo) y actualiza el modelo RA.
 */
export async function subirTexturasRAAction(
  modeloRAId: number,
  libroId: string,
  formData: FormData,
): Promise<ActionResponse> {
  const cleanId = sanitizeText(libroId);
  if (!cleanId || !isValidUUID(cleanId)) {
    return { success: false, errors: { form: "El identificador del libro no es válido." } };
  }

  const files = extractRAFilesFromFormData(formData);

  if (Object.keys(files).length === 0) {
    return { success: true, message: "No se proporcionaron nuevas texturas." };
  }

  return await uploadAndUpdateTexturas(modeloRAId, cleanId, files);
}
