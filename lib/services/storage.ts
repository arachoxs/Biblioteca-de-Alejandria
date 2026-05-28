import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { ImageUploadResult } from "@/lib/types/noticia";

const BUCKET_NAME = "imagenes-noticias";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Extrae el path de storage de una URL pública de Supabase.
 * Ejemplo: https://xxx.supabase.co/storage/v1/object/public/imagenes-noticias/noticias/123/img.jpg
 * Retorna: imagenes-noticias/noticias/123/img.jpg
 */
export function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/");
    const bucketIndex = pathSegments.indexOf(BUCKET_NAME);

    if (bucketIndex === -1) return null;

    return pathSegments.slice(bucketIndex).join("/");
  } catch {
    return null;
  }
}

/**
 * Sube una imagen a Supabase Storage.
 * @param file Archivo a subir
 * @param noticiaId ID de la noticia (usado como carpeta)
 * @returns Resultado con la URL pública o error
 */
export async function uploadNoticiaImage(
  file: File,
  noticiaId: string
): Promise<ImageUploadResult> {
  // Validar tipo
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Tipo de archivo no permitido. Use JPEG, PNG, WebP o GIF.",
    };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "El archivo excede el tamaño máximo de 5MB.",
    };
  }

  const adminClient = createAdminClient();

  // Generar path único
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `noticias/${noticiaId}/${timestamp}-${sanitizedFilename}`;

  // Subir archivo
  const { error } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("[storage] Error subiendo imagen:", error);
    return {
      success: false,
      error: "Error al subir la imagen. Intente nuevamente.",
    };
  }

  // Obtener URL pública
  const { data: urlData } = adminClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    success: true,
    url: urlData.publicUrl,
  };
}

/**
 * Elimina una imagen de Supabase Storage.
 * @param url URL pública de la imagen
 * @returns true si se eliminó correctamente
 */
export async function deleteNoticiaImage(url: string): Promise<boolean> {
  const path = extractStoragePath(url);

  if (!path) {
    console.error("[storage] No se pudo extraer el path de la URL:", url);
    return false;
  }

  const adminClient = createAdminClient();

  // Remover el prefijo del bucket del path para la API de storage
  const storagePath = path.replace(`${BUCKET_NAME}/`, "");

  const { error } = await adminClient.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error("[storage] Error eliminando imagen:", error);
    return false;
  }

  return true;
}
