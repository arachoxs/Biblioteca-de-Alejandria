"use server";

import {
  obtenerNoticiasAdmin,
  actualizarNoticia,
  toggleVisibilidad,
  reordenarNoticias,
  subirImagenNoticia,
  eliminarImagenNoticia,
} from "@/services/noticias/noticiaService";
import { sanitizeText, toSafePositiveInt } from "@/lib/validations/rules";
import type { ActionResponse } from "@/lib/types/common";
import type { NoticiaAdminItem, ReorderItem } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";

// ─── Lectura ───────────────────────────────────────────────────────

export async function getNoticiasAdminAction(
  page: number = 1,
  pageSize: number = 20,
  searchTerm?: string
): Promise<ActionResponse & { data?: Paginated<NoticiaAdminItem> }> {
  const safePage = toSafePositiveInt(page, 1);
  const safePageSize = toSafePositiveInt(pageSize, 20);
  const cleanTerm = searchTerm ? sanitizeText(searchTerm) : undefined;

  const result = await obtenerNoticiasAdmin(safePage, safePageSize, cleanTerm || undefined);
  return { success: true, data: result };
}

// ─── Escritura ─────────────────────────────────────────────────────

export async function actualizarNoticiaAction(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  const esVisible = formData.get("es_visible") === "true";
  const fechaExpiracion = formData.get("fecha_expiracion") as string;

  if (!fechaExpiracion) {
    return { success: false, message: "La fecha de expiración es requerida." };
  }

  // Validar que la fecha sea futura
  const fecha = new Date(fechaExpiracion);
  if (isNaN(fecha.getTime()) || fecha <= new Date()) {
    return { success: false, message: "La fecha de expiración debe ser una fecha futura." };
  }

  const result = await actualizarNoticia(id, {
    es_visible: esVisible,
    fecha_expiracion: fecha.toISOString(),
  });

  if (!result.success) {
    return { success: false, message: result.error || "Error actualizando noticia." };
  }

  return { success: true, message: "Noticia actualizada exitosamente." };
}

export async function toggleVisibilidadAction(
  id: string,
  esVisible: boolean
): Promise<ActionResponse> {
  const result = await toggleVisibilidad(id, esVisible);

  if (!result.success) {
    return { success: false, message: result.error || "Error actualizando visibilidad." };
  }

  return { success: true, message: esVisible ? "Noticia visible." : "Noticia oculta." };
}

export async function reordenarNoticiasAction(
  items: ReorderItem[]
): Promise<ActionResponse> {
  if (!items || items.length === 0) {
    return { success: false, message: "No hay items para reordenar." };
  }

  const result = await reordenarNoticias(items);

  if (!result.success) {
    return { success: false, message: result.error || "Error reordenando noticias." };
  }

  return { success: true, message: "Orden actualizado exitosamente." };
}

export async function subirImagenAction(
  noticiaId: string,
  formData: FormData
): Promise<ActionResponse & { url?: string }> {
  const file = formData.get("imagen") as File;

  if (!file || file.size === 0) {
    return { success: false, message: "No se seleccionó ningún archivo." };
  }

  const result = await subirImagenNoticia(file, noticiaId);

  if (!result.success) {
    return { success: false, message: result.error || "Error subiendo imagen." };
  }

  return { success: true, message: "Imagen subida exitosamente.", url: result.url };
}

export async function eliminarImagenAction(
  noticiaId: string,
  imageUrl: string
): Promise<ActionResponse> {
  if (!imageUrl) {
    return { success: false, message: "URL de imagen requerida." };
  }

  const result = await eliminarImagenNoticia(noticiaId, imageUrl);

  if (!result.success) {
    return { success: false, message: result.error || "Error eliminando imagen." };
  }

  return { success: true, message: "Imagen eliminada exitosamente." };
}
