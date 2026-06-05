import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/supabase";
import type { ConfigRow } from "@/lib/types/config";

export async function getConfig(clave: string): Promise<ConfigRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("configuracion")
    .select("*")
    .eq("clave", clave)
    .maybeSingle();

  if (error) {
    console.error("[configModel] Error obteniendo config:", error);
    throw error;
  }

  return data;
}

export async function getAllConfigs(): Promise<ConfigRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("configuracion")
    .select("*")
    .order("clave");

  if (error) {
    console.error("[configModel] Error obteniendo configs:", error);
    throw error;
  }

  return data ?? [];
}

export async function updateConfig(clave: string, valor: Json): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("configuracion")
    .update({ valor, updated_at: new Date().toISOString() })
    .eq("clave", clave);

  if (error) {
    console.error("[configModel] Error actualizando config:", error);
    throw error;
  }
}
