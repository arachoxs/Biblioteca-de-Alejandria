import { 
  getAllNoticiasWithLibroCompleto, 
  getNoticiaCompletaById,
  getNoticiasAdmin,
  updateNoticia,
  bulkUpdateOrden,
  getNoticiaById,
} from "@/models/noticiaModel";
import type { NoticiaId, NoticiaFilters, UpdateNoticiaPayload, ReorderItem, NoticiaAdminItem } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { getErrorMessage } from "@/lib/services/errors";
import { uploadNoticiaImage, deleteNoticiaImage } from "@/lib/services/storage";

export interface BuscarNoticiasParams {
  page?: number;
  pageSize?: number;
  q?: string;
  autor?: string;
  categoria?: string;
  ano_publicacion?: number;
  idioma?: string;
  editorial?: string;
  precioMin?: number;
  precioMax?: number;
  estado?: "nuevo" | "usado";
}

export async function buscarNoticias(
  params: BuscarNoticiasParams
): Promise<Paginated<NoticiaWithLibroCompleto>> {
  const {
    page = 1,
    pageSize = 20,
    q,
    autor,
    categoria,
    ano_publicacion,
    idioma,
    editorial,
    precioMin,
    precioMax,
    estado,
  } = params;

  const filters: NoticiaFilters = {
    searchTerm: q,
    autor,
    categoria,
    ano_publicacion,
    idioma,
    editorial,
    precioMin,
    precioMax,
    estado,
  };

  try {
    const result = await getAllNoticiasWithLibroCompleto(page, pageSize, filters);
    return result;
  } catch (error) {
    console.error("[noticiaService] Error searching noticias:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

export async function getNoticiaDetalle(
  id: NoticiaId
): Promise<NoticiaWithLibroCompleto | null> {
  try {
    return await getNoticiaCompletaById(id);
  } catch (error) {
    console.error("[noticiaService] Error getting noticia detalle:", error);
    return null;
  }
}

// ─── Funciones para gestión de noticias (admin) ────────────────────

/**
 * Obtiene todas las noticias para el panel de administración.
 */
export async function obtenerNoticiasAdmin(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string
): Promise<Paginated<NoticiaAdminItem>> {
  try {
    return await getNoticiasAdmin(page, pageSize, searchTerm);
  } catch (error) {
    console.error("[noticiaService] Error obteniendo noticias admin:", error);
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Actualiza los campos de una noticia (visibilidad, expiración).
 */
export async function actualizarNoticia(
  id: NoticiaId,
  data: UpdateNoticiaPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNoticia(id, data);
    return { success: true };
  } catch (error) {
    console.error("[noticiaService] Error actualizando noticia:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Toggle rápido de visibilidad.
 */
export async function toggleVisibilidad(
  id: NoticiaId,
  esVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNoticia(id, { es_visible: esVisible });
    return { success: true };
  } catch (error) {
    console.error("[noticiaService] Error toggling visibilidad:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Actualiza la fecha de expiración.
 */
export async function actualizarFechaExpiracion(
  id: NoticiaId,
  fechaExpiracion: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNoticia(id, { fecha_expiracion: fechaExpiracion });
    return { success: true };
  } catch (error) {
    console.error("[noticiaService] Error actualizando fecha expiración:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Reordena las noticias por drag-and-drop.
 */
export async function reordenarNoticias(
  items: ReorderItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await bulkUpdateOrden(items);
    return { success: true };
  } catch (error) {
    console.error("[noticiaService] Error reordenando noticias:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Sube una imagen a Supabase Storage y actualiza el array de imágenes.
 */
export async function subirImagenNoticia(
  file: File,
  noticiaId: NoticiaId
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Obtener noticia actual
    const noticia = await getNoticiaById(noticiaId);
    if (!noticia) {
      return { success: false, error: "Noticia no encontrada" };
    }

    // Validar máximo de imágenes
    const imagenesActuales = (noticia.imagenes as string[]) ?? [];
    if (imagenesActuales.length >= 10) {
      return { success: false, error: "Máximo 10 imágenes por noticia" };
    }

    // Subir imagen
    const uploadResult = await uploadNoticiaImage(file, noticiaId);
    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error };
    }

    // Actualizar array de imágenes
    const nuevasImagenes = [...imagenesActuales, uploadResult.url];
    await updateNoticia(noticiaId, { imagenes: nuevasImagenes });

    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error("[noticiaService] Error subiendo imagen:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Elimina una imagen de Storage y actualiza el array de imágenes.
 */
export async function eliminarImagenNoticia(
  noticiaId: NoticiaId,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener noticia actual
    const noticia = await getNoticiaById(noticiaId);
    if (!noticia) {
      return { success: false, error: "Noticia no encontrada" };
    }

    // Eliminar de Storage
    const deleted = await deleteNoticiaImage(imageUrl);
    if (!deleted) {
      return { success: false, error: "Error eliminando imagen del storage" };
    }

    // Actualizar array de imágenes
    const imagenesActuales = (noticia.imagenes as string[]) ?? [];
    const nuevasImagenes = imagenesActuales.filter((img) => img !== imageUrl);
    await updateNoticia(noticiaId, { imagenes: nuevasImagenes });

    return { success: true };
  } catch (error) {
    console.error("[noticiaService] Error eliminando imagen:", error);
    return { success: false, error: getErrorMessage(error) };
  }
}