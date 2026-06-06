import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

const BUCKET_NAME = "texturas-ra";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type TexturaTipo = "portada" | "contraportada" | "lomo";

export interface TexturaUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Extrae el path de storage de una URL pública de Supabase para el bucket texturas-ra.
 */
export function extractRAStoragePath(url: string): string | null {
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
 * Sube una textura de libro a Supabase Storage.
 * @param file Archivo de imagen a subir
 * @param libroId UUID del libro (usado como carpeta)
 * @param tipo Tipo de textura: portada, contraportada o lomo
 * @returns Resultado con la URL pública o error
 */
export async function uploadTexturaRA(
  file: File,
  libroId: string,
  tipo: TexturaTipo,
): Promise<TexturaUploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Tipo de archivo no permitido. Use JPEG, PNG o WebP.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "El archivo excede el tamaño máximo de 5MB.",
    };
  }

  const adminClient = createAdminClient();

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${libroId}/${tipo}.${ext}`;

  const { error } = await adminClient.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("[ra-storage] Error subiendo textura:", error);
    return {
      success: false,
      error: "Error al subir la textura. Intente nuevamente.",
    };
  }

  const { data: urlData } = adminClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    success: true,
    url: urlData.publicUrl,
  };
}

/**
 * Elimina una textura de Supabase Storage.
 * @param url URL pública de la textura
 * @returns true si se eliminó correctamente
 */
export async function deleteTexturaRA(url: string): Promise<boolean> {
  const path = extractRAStoragePath(url);

  if (!path) {
    console.error("[ra-storage] No se pudo extraer el path de la URL:", url);
    return false;
  }

  const adminClient = createAdminClient();

  const storagePath = path.replace(`${BUCKET_NAME}/`, "");

  const { error } = await adminClient.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error("[ra-storage] Error eliminando textura:", error);
    return false;
  }

  return true;
}
