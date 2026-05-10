import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, ModelResultWithId } from "@/lib/types/common";

// ─── Tipos internos ────────────────────────────────────────────────

interface AddressInput {
  direccion: string;
  placeId: string;
  detalle?: string;
}

interface TiendaAddressInfo {
  tienda_id: string;
  tienda_nombre: string;
  direccion_id: number;
  direccion_formateada: string;
  place_id: string;
  detalle_direccion: string | null;
}

// ─── Operaciones CRUD ──────────────────────────────────────────────

/**
 * Inserta una nueva dirección en la tabla `direccion`.
 * Retorna el `id` generado o un error descriptivo.
 */
export async function createAddress(
  input: AddressInput,
): Promise<ModelResultWithId> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("direccion")
    .insert({
      direccion_formateada: input.direccion,
      place_id: input.placeId,
      detalle_direccion: input.detalle ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error al registrar la dirección:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data.id };
}

/**
 * Elimina una dirección por su ID. Usado durante rollback.
 */
export async function deleteAddress(id: number): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("direccion").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar dirección (rollback):", error);
  }
}

/**
 * Actualiza una dirección existente por su ID.
 */
export async function updateAddress(
  id: number,
  input: AddressInput,
): Promise<ModelResult> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("direccion")
    .update({
      direccion_formateada: input.direccion,
      place_id: input.placeId,
      detalle_direccion: input.detalle ?? null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    console.error("Error al actualizar dirección:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    console.error(
      `Error al actualizar dirección: no se encontró registro con id=${id}`,
    );
    return { success: false, error: "Dirección no encontrada" };
  }
  return { success: true };
}

export async function isTiendaAddressUsed(placeId: string): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .select("direccion:direccion!inner(place_id)")
    .is("deleted_at", null)
    .eq("direccion.place_id", placeId)
    .limit(1);
  if (error) {
    console.error("Error al verificar uso de dirección en tiendas:", error);
    throw new Error("Error al verificar uso de dirección en tiendas");
  }

  return data.length > 0;
}

export async function getPlaceIdByAddressId(
  id: number,
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("direccion")
    .select("place_id")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error al obtener place_id por id de dirección:", error);
    throw new Error("No se pudo obtener la dirección actual de la tienda");
  }

  if (!data) {
    throw new Error("No se encontró la dirección actual de la tienda");
  }

  return data.place_id;
}
