import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { EntregaCreateInput, EntregaRow } from "@/lib/types/entrega";

export async function insertEntrega(
  input: EntregaCreateInput
): Promise<EntregaRow> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("entrega")
    .insert({
      id_compra: input.id_compra,
      tipo: input.tipo,
      costo: input.costo,
      fecha_entrega_estimada: input.fecha_entrega_estimada,
      id_direccion_origen: input.id_direccion_origen,
      id_direccion_destino: input.id_direccion_destino,
      estado: input.estado ?? "en preparacion",
    })
    .select("*")
    .single();

  if (error) {
    console.error("[entregaModel] Error:", error);
    throw error;
  }

  return data;
}
