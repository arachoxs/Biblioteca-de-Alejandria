import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { DevolucionRow, EstadoDevolucion } from "@/lib/types/devolucion";

/**
 * Crea un registro de devolución con estado "revision" y fecha actual.
 * El token se genera automáticamente por la DB (DEFAULT gen_random_uuid()).
 */
export async function createDevolucion(
  id_usuario: string,
): Promise<DevolucionRow> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("devolucion")
    .insert({
      id_usuario,
      estado: "revision",
      fecha: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("[devolucionModel] Error al crear devolución:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene una devolución por su ID.
 */
export async function getDevolucionById(
  id: number,
): Promise<DevolucionRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("devolucion")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[devolucionModel] Error al obtener devolución por ID:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene una devolución por su token UUID.
 */
export async function getDevolucionByToken(
  token: string,
): Promise<DevolucionRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("devolucion")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error(
      "[devolucionModel] Error al obtener devolución por token:",
      error,
    );
    throw error;
  }

  return data;
}

/**
 * Obtiene todas las devoluciones de un usuario ordenadas por fecha descendente.
 */
export async function getDevolucionesByUserId(
  userId: string,
): Promise<DevolucionRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("devolucion")
    .select("*")
    .eq("id_usuario", userId)
    .order("fecha", { ascending: false });

  if (error) {
    console.error(
      "[devolucionModel] Error al obtener devoluciones del usuario:",
      error,
    );
    throw error;
  }

  return data ?? [];
}

/**
 * Actualiza el estado de una devolución.
 */
export async function updateDevolucionEstado(
  id: number,
  estado: EstadoDevolucion,
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("devolucion")
    .update({ estado })
    .eq("id", id);

  if (error) {
    console.error(
      "[devolucionModel] Error al actualizar estado de devolución:",
      error,
    );
    throw error;
  }
}
