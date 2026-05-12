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
import type {
  InsertLibroPayload,
  UpdateLibroPayload,
  LibrosListResponse,
  LibroActionResponse,
  CondicionLibro,
} from "@/lib/types/libro";
import type { ActionResponse } from "@/lib/types/common";
import type { HistoricoTimelineResponse } from "@/lib/types/historico";

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

/**
 * Carga autores paginados para selector (pageSize=100).
 */
export async function getAuthorOptionsAction(
  searchTerm?: string,
): Promise<ActionResponse & { data?: { value: string; label: string }[] }> {
  const cleanTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  const result = await fetchAuthors(1, 100, cleanTerm || undefined);

  if (!result.success || !result.data) {
    return { success: false, message: result.message || "Error cargando autores." };
  }

  return {
    success: true,
    data: result.data.data.map((a) => ({
      value: String(a.id),
      label: a.nombre || "Sin nombre",
    })),
  };
}

/**
 * Carga categorías paginadas para selector (pageSize=100).
 */
export async function getCategoryOptionsAction(
  searchTerm?: string,
): Promise<ActionResponse & { data?: { value: string; label: string }[] }> {
  const cleanTerm = searchTerm ? sanitizeText(searchTerm) : undefined;
  const result = await fetchCategories(1, 100, cleanTerm || undefined);

  if (!result.success || !result.data) {
    return { success: false, message: result.message || "Error cargando categorías." };
  }

  return {
    success: true,
    data: result.data.data.map((c) => ({
      value: String(c.id),
      label: c.nombre || "Sin nombre",
    })),
  };
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

export async function getLibroHistoricoTimelineAction(
  libroId: string,
): Promise<HistoricoTimelineResponse> {
  const cleanLibroId = sanitizeText(libroId);
  if (!isValidUUID(cleanLibroId)) {
    return {
      success: false,
      errors: { libro_id: "El identificador del libro no es válido." },
    };
  }

  return await fetchBookHistoricoTimeline(cleanLibroId);
}

// ─── Mutaciones ────────────────────────────────────────────────────

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
  // Sanitizar
  const cleaned = {
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

  // Validar
  const errors = validateLibro(cleaned);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const payload: InsertLibroPayload = {
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

  // Inventario obligatorio → bodega principal
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

  const cleaned = {
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

  const errors = validateLibro(cleaned);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const payload: UpdateLibroPayload = {
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

  return await editBook(cleanId, payload);
}

export async function eliminarLibroAction(
  id: string,
  titulo: string,
  estado: string,
): Promise<LibroActionResponse> {
  const cleanId = sanitizeText(id);
  if (!cleanId) {
    return { success: false, message: "ID de libro no válido." };
  }

  return await removeBook(cleanId, sanitizeText(titulo));
}
