import { createAdminClient } from "@/lib/supabase/server";
import type {
  InsertModeloRAPayload,
  ModeloRARow,
  UpdateModeloRAPayload,
} from "@/lib/types/modelo_ra";

/**
 * Inserta un nuevo modelo RA en la tabla `modelo_ra`.
 */
export async function createModeloRA(
  input: InsertModeloRAPayload
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
 * Obtiene un modelo RA activo por ID.
 * Helper para validaciones y lectura en el contexto de libro.
 * Usado por servicios de libro para enriquecer datos de RA.
 */
export async function getActiveModeloRAById(
  modeloRAId: number
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

function buildModeloRAUpdatePayload(
  input: UpdateModeloRAPayload,
): Partial<UpdateModeloRAPayload> {
  const payload: Partial<UpdateModeloRAPayload> = {};
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

  const payload: UpdateModeloRAPayload = buildModeloRAUpdatePayload(input);

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
 * Realiza eliminacion logica de un modelo RA activo por su ID.
 */
export async function softDeleteModeloRAById(
  modeloRAId: number
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
