import { createAdminClient } from "@/lib/supabase/server";

// ─── Tipos internos ────────────────────────────────────────────────

interface AddressInput {
  direccion: string;
  placeId: string;
  detalle?: string;
}

interface CreateAddressResult {
  success: boolean;
  id?: number;
  error?: string;
}

// ─── Operaciones CRUD ──────────────────────────────────────────────

/**
 * Inserta una nueva dirección en la tabla `direccion`.
 * Retorna el `id` generado o un error descriptivo.
 */
export async function createAddress(
  input: AddressInput
): Promise<CreateAddressResult> {
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
