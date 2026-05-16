import { createAdminClient } from "@/lib/supabase/server";

interface TarjetaInsert {
  id_usuario: string;
  hash_numero_tarjeta: string;
  hash_cvv: string;
  nombre_titular: string;
  mes_caducidad: number;
  ano_caducidad: number;
  saldo: number;
}

interface TarjetaRow {
  id: number;
  id_usuario: string;
  hash_numero_tarjeta: string | null;
  hash_cvv: string | null;
  nombre_titular: string | null;
  mes_caducidad: number;
  ano_caducidad: number;
  saldo: number;
  deleted_at: string | null;
  created_at?: string;
}

export async function createTarjeta(input: TarjetaInsert): Promise<number> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta")
    .insert({
      id_usuario: input.id_usuario,
      hash_numero_tarjeta: input.hash_numero_tarjeta,
      hash_cvv: input.hash_cvv,
      nombre_titular: input.nombre_titular,
      mes_caducidad: input.mes_caducidad,
      ano_caducidad: input.ano_caducidad,
      saldo: input.saldo,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[tarjetaModel] Error al crear tarjeta:", error);
    throw error;
  }

  return data.id;
}

export async function getTarjetaById(
  id: number
): Promise<TarjetaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tarjetaModel] Error al obtener tarjeta:", error);
    throw error;
  }

  return data;
}

export async function getTarjetasByUserId(userId: string): Promise<TarjetaRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tarjeta")
    .select("*")
    .eq("id_usuario", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tarjetaModel] Error al obtener tarjetas del usuario:", error);
    throw error;
  }

  return data;
}



export async function softDeleteTarjeta(id: number): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("tarjeta")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[tarjetaModel] Error al eliminar tarjeta:", error);
    throw error;
  }
}

export async function addBalance(
  id: number,
  amount: number
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await (adminClient as unknown as {
    rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: unknown }>;
  }).rpc("add_tarjeta_balance", {
    tarjeta_id: id,
    amount,
  });

  if (error) {
    console.error("[tarjetaModel] Error al añadir saldo:", error);
    throw error;
  }
}