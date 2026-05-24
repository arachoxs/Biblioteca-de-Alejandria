import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { ItemCompraCreateInput, ItemCompraRow } from "@/lib/types/itemCompra";

/**
 * Inserts a single item_compra record.
 */
export async function insertItemCompra(
  input: ItemCompraCreateInput,
): Promise<ItemCompraRow> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("item_compra")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    console.error("[itemCompraModel] Error inserting item_compra:", error);
    throw error;
  }

  return data;
}

/**
 * Inserts multiple item_compra records atomically.
 * Returns all inserted rows.
 */
export async function insertItemComprasBatch(
  items: ItemCompraCreateInput[],
): Promise<ItemCompraRow[]> {
  if (items.length === 0) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("item_compra")
    .insert(items)
    .select("*");

  if (error) {
    console.error("[itemCompraModel] Error inserting item_compra batch:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Gets all item_compra records for a given compra ID.
 */
export async function getItemComprasByCompraId(
  id_compra: string,
): Promise<ItemCompraRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("item_compra")
    .select("*")
    .eq("id_compra", id_compra);

  if (error) {
    console.error("[itemCompraModel] Error getting item_compras by compra id:", error);
    throw error;
  }

  return data ?? [];
}
