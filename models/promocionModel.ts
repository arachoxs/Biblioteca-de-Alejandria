import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { PromocionInsert, PromocionActiva } from "@/lib/types/promocion";

export interface UsuarioCumpleanos {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export async function findUsuariosConCumpleanosHoy(): Promise<UsuarioCumpleanos[]> {
  const adminClient = createAdminClient();
  const today = new Date();
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();

  const { data: usuarios, error } = await adminClient
    .from("usuario")
    .select("id, nombres, apellidos, fecha_nacimiento")
    .is("deleted_at", null);

  if (error) {
    console.error("[promocionModel] Error buscando usuarios con cumpleaños:", error);
    throw error;
  }

  const cumpleaneros = (usuarios ?? []).filter((u) => {
    if (!u.fecha_nacimiento) return false;
    const fecha = new Date(u.fecha_nacimiento);
    return fecha.getUTCMonth() + 1 === month && fecha.getUTCDate() === day;
  });

  const results: UsuarioCumpleanos[] = [];
  for (const u of cumpleaneros) {
    try {
      const { data: authUser } = await adminClient.auth.admin.getUserById(u.id);
      if (authUser.user?.email) {
        results.push({
          id: u.id,
          nombres: u.nombres,
          apellidos: u.apellidos,
          email: authUser.user.email,
        });
      }
    } catch {
      console.error(`[promocionModel] Error obteniendo email para usuario ${u.id}`);
    }
  }

  return results;
}

export async function findActiveByUser(userId: string): Promise<PromocionActiva | null> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("promocion")
    .select("id, porcentaje_descuento, nombre")
    .eq("id_usuario", userId)
    .eq("usada", false)
    .is("deleted_at", null)
    .gte("fecha_expiracion", now)
    .order("fecha_expiracion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[promocionModel] Error buscando promoción activa:", error);
    throw error;
  }

  return data;
}

export async function create(data: PromocionInsert): Promise<number> {
  const adminClient = createAdminClient();

  const { data: row, error } = await adminClient
    .from("promocion")
    .insert({
      nombre: data.nombre,
      porcentaje_descuento: data.porcentaje_descuento,
      tipo: data.tipo,
      id_usuario: data.id_usuario,
      fecha_expiracion: data.fecha_expiracion,
      usada: data.usada ?? false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[promocionModel] Error creando promoción:", error);
    throw error;
  }

  return row.id;
}

export async function markAsUsed(id: number): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("promocion")
    .update({ usada: true })
    .eq("id", id);

  if (error) {
    console.error("[promocionModel] Error marcando promoción como usada:", error);
    throw error;
  }
}

export async function unmarkAsUsed(id: number): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("promocion")
    .update({ usada: false })
    .eq("id", id);

  if (error) {
    console.error("[promocionModel] Error desmarcando promoción:", error);
    throw error;
  }
}

export async function deleteExpired(): Promise<number> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("promocion")
    .update({ deleted_at: now })
    .is("deleted_at", null)
    .eq("usada", false)
    .lt("fecha_expiracion", now)
    .select("id");

  if (error) {
    console.error("[promocionModel] Error eliminando promociones expiradas:", error);
    throw error;
  }

  return data?.length ?? 0;
}
