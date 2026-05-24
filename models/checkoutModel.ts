import "server-only"

import { createAdminClient } from "@/lib/supabase/server"
import type { TiendaConDireccion, DisponibilidadLibroTienda } from "@/lib/types/checkout"

type DireccionPlace = { direccion_formateada: string; place_id: string }

function mapTiendaRow(row: { id: string; nombre: string; direccion: unknown }): TiendaConDireccion {
  const direccion = row.direccion as DireccionPlace
  return {
    id: row.id,
    nombre: row.nombre,
    direccion_formateada: direccion.direccion_formateada,
    place_id: direccion.place_id,
  }
}

function mapInventarioRow(row: { libro_id: string | null; tienda_id: string | null; stock_disponible: number | null }): DisponibilidadLibroTienda {
  return {
    libroId: row.libro_id ?? "",
    tiendaId: row.tienda_id ?? "",
    stockDisponible: row.stock_disponible ?? 0,
  }
}

export async function getTiendasConDireccion(): Promise<TiendaConDireccion[]> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("tienda")
    .select("id, nombre, direccion!inner(direccion_formateada, place_id)")
    .is("deleted_at", null)
    .is("es_bodega", false)
    .order("nombre", { ascending: true })

  if (error) {
    console.error("[checkoutModel] Error al obtener tiendas:", error)
    throw error
  }

  return (data ?? []).map(mapTiendaRow)
}

export async function getDisponibilidadMultiTienda(
  libroIds: string[],
  tiendaIds: string[],
): Promise<DisponibilidadLibroTienda[]> {
  if (libroIds.length === 0 || tiendaIds.length === 0) return []

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("vista_inventario")
    .select("libro_id, tienda_id, stock_disponible")
    .in("libro_id", libroIds)
    .in("tienda_id", tiendaIds)
    .gt("stock_disponible", 0)

  if (error) {
    console.error("[checkoutModel] Error al obtener disponibilidad:", error)
    throw error
  }

  return (data ?? []).map(mapInventarioRow)
}

export async function getUserPlaceId(userId: string): Promise<string | null> {
  if (!userId?.trim()) {
    return null
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("usuario")
    .select("id_direccion, direccion!inner(place_id)")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) {
    console.error("[checkoutModel] Error al obtener dirección del usuario:", error)
    throw error
  }

  const direccion = data?.direccion as DireccionPlace | undefined
  return direccion?.place_id ?? null
}
