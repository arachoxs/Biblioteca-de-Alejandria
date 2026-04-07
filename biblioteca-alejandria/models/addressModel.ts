import { createAdminClient } from "@/lib/supabase/server";
import type { ModelResult, ModelResultWithId } from "@/lib/types/common";

// ─── Tipos internos ────────────────────────────────────────────────

interface AddressInput {
  direccion: string;
  placeId: string;
  detalle?: string;
}

// ─── Operaciones CRUD ──────────────────────────────────────────────

/**
 * Inserta una nueva dirección en la tabla `direccion`.
 * Retorna el `id` generado o un error descriptivo.
 */
export async function createAddress(
  input: AddressInput
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

  const { error } = await adminClient
    .from("direccion")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar dirección (rollback):", error);
  }
}

/**
 * Actualiza una dirección existente por su ID.
 */
export async function updateAddress(
  id: number,
  input: AddressInput
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
      `Error al actualizar dirección: no se encontró registro con id=${id}`
    );
    return { success: false, error: "Dirección no encontrada" };
  }
  return { success: true };
}
