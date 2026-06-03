import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { InsertRespuestaPayload } from "@/lib/types/respuesta";

// ─── Escritura ──────────────────────────────────────────────────────

/**
 * Crea una nueva respuesta en un hilo de mensajería.
 * Retorna el ID de la respuesta creada.
 */
export async function createRespuesta(
  input: InsertRespuestaPayload
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("respuesta")
    .insert(input)
    .select("id")
    .single();

  if (error) {
    console.error("[respuestaModel] Error creando respuesta:", error);
    throw error;
  }

  return data.id;
}

// ─── Lectura ────────────────────────────────────────────────────────

/**
 * Cuenta las respuestas de un hilo específico.
 */
export async function countRespuestasByHilo(
  hiloId: string
): Promise<number> {
  const adminClient = createAdminClient();

  const { count, error } = await adminClient
    .from("respuesta")
    .select("id", { count: "exact", head: true })
    .eq("id_hilo", hiloId)
    .is("deleted_at", null);

  if (error) {
    console.error("[respuestaModel] Error contando respuestas:", error);
    throw error;
  }

  return count ?? 0;
}

/**
 * Soft delete de una respuesta.
 */
export async function softDeleteRespuesta(id: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("respuesta")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[respuestaModel] Error eliminando respuesta:", error);
    throw error;
  }
}
