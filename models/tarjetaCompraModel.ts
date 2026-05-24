import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { TarjetaCompraCreateInput, TarjetaCompraRow } from "@/lib/types/tarjetaCompra";

/**
 * Inserta un solo registro de tarjeta_compra.
 */
export async function insertTarjetaCompra(
  input: TarjetaCompraCreateInput
): Promise<TarjetaCompraRow> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta_compra")
    .insert({
      id_compra: input.id_compra,
      id_tarjeta: input.id_tarjeta,
      monto: input.monto,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[tarjetaCompraModel] Error insertando tarjeta_compra:", error);
    throw error;
  }

  return data;
}

/**
 * Inserta múltiples registros de tarjeta_compra atómicamente (para pagos divididos).
 * Retorna todos los registros insertados.
 */
export async function insertTarjetaComprasBatch(
  items: TarjetaCompraCreateInput[]
): Promise<TarjetaCompraRow[]> {
  if (items.length === 0) {
    return [];
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta_compra")
    .insert(items)
    .select("*");

  if (error) {
    console.error("[tarjetaCompraModel] Error insertando tarjeta_compra en batch:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene todos los registros de tarjeta_compra para una compra dada.
 */
export async function getTarjetaComprasByCompraId(
  id_compra: string
): Promise<TarjetaCompraRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta_compra")
    .select("*")
    .eq("id_compra", id_compra);

  if (error) {
    console.error("[tarjetaCompraModel] Error obteniendo tarjetas_compra por id_compra:", error);
    throw error;
  }

  return data ?? [];
}