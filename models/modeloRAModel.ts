import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/supabase";
import type {
  InsertModeloRAPayload,
  ModeloRARow,
  UpdateModeloRAPayload,
} from "@/lib/types/modelo_ra";
import {
  createDefaultDimensiones,
  createDefaultTexturas,
} from "@/lib/types/modelo_ra";

type ModeloRAUpdateRow = Database["public"]["Tables"]["modelo_ra"]["Update"];

/**
 * Inserta un nuevo modelo RA en la tabla `modelo_ra`.
 */
export async function createModeloRA(
  input: InsertModeloRAPayload,
): Promise<number> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("modelo_ra")
    .insert({
      dimensiones: input.dimensiones,
      texturas: input.texturas,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[modeloRAModel] Error al crear modelo RA:", error);
    throw error;
  }

  return data.id;
}

/**
 * Crea un modelo RA con dimensiones y texturas por defecto para un libro nuevo.
 * @param paginas Número de páginas del libro (para calcular profundidad)
 * @returns ID del modelo RA creado
 */
export async function createDefaultModeloRA(paginas: number): Promise<number> {
  const dimensiones = createDefaultDimensiones(paginas);
  const texturas = createDefaultTexturas();
  return createModeloRA({ dimensiones, texturas });
}

/**
 * Obtiene un modelo RA activo por ID.
 */
export async function getActiveModeloRAById(
  modeloRAId: number,
): Promise<ModeloRARow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("modelo_ra")
    .select("*")
    .eq("id", modeloRAId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[modeloRAModel] Error al obtener modelo RA por ID:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene el modelo RA asociado a un libro activo.
 */
export async function getModeloRAByLibroId(
  libroId: string,
): Promise<ModeloRARow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("libro")
    .select("modelo_ra(*)")
    .eq("id", libroId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[modeloRAModel] Error al obtener modelo RA por libro:", error);
    throw error;
  }

  if (!data) return null;

  const modeloRA = (data as Record<string, unknown>).modelo_ra;
  if (!modeloRA || typeof modeloRA !== "object") return null;

  return modeloRA as ModeloRARow;
}

function buildModeloRAUpdatePayload(
  input: UpdateModeloRAPayload,
): Partial<ModeloRAUpdateRow> {
  const payload: Partial<ModeloRAUpdateRow> = {};
  if (input.dimensiones !== undefined) payload.dimensiones = input.dimensiones;
  if (input.texturas !== undefined) payload.texturas = input.texturas;
  return payload;
}

/**
 * Actualiza un modelo RA activo por su ID.
 */
export async function updateModeloRAById(
  modeloRAId: number,
  input: UpdateModeloRAPayload,
): Promise<void> {
  const adminClient = createAdminClient();

  const payload = buildModeloRAUpdatePayload(input);

  if (Object.keys(payload).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar.");
  }

  const { data, error } = await adminClient
    .from("modelo_ra")
    .update(payload)
    .eq("id", modeloRAId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("[modeloRAModel] Error al actualizar modelo RA:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Modelo RA no encontrado.");
  }
}

/**
 * Realiza eliminación lógica de un modelo RA activo por su ID.
 */
export async function softDeleteModeloRAById(
  modeloRAId: number,
): Promise<void> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("modelo_ra")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", modeloRAId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("[modeloRAModel] Error al eliminar modelo RA:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Modelo RA no encontrado.");
  }
}
