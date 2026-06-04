import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type {
  ItemDevolucionRow,
  MotivoDevolucion,
} from "@/lib/types/devolucion";

interface ItemDevolucionInsertInput {
  id_devolucion: number;
  id_copia: string;
  motivo: MotivoDevolucion;
  descripcion_motivo?: string;
}

/**
 * Inserta múltiples item_devolucion registros en batch.
 */
export async function insertItemDevolucionBatch(
  items: ItemDevolucionInsertInput[],
): Promise<ItemDevolucionRow[]> {
  if (items.length === 0) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("item_devolucion")
    .insert(items)
    .select("*");

  if (error) {
    console.error(
      "[itemDevolucionModel] Error al insertar items de devolución:",
      error,
    );
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene todos los items de una devolución por su ID.
 */
export async function getItemsByDevolucionId(
  id_devolucion: number,
): Promise<ItemDevolucionRow[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("item_devolucion")
    .select("*")
    .eq("id_devolucion", id_devolucion);

  if (error) {
    console.error(
      "[itemDevolucionModel] Error al obtener items por devolución:",
      error,
    );
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene los IDs de copias que ya tienen devolución asociada
 * para un usuario específico (a través de la tabla devolucion).
 */
export async function getDevueltosCopiaIdsByUsuario(
  userId: string,
): Promise<string[]> {
  const adminClient = createAdminClient();

  const { data: devoluciones, error: devError } = await adminClient
    .from("devolucion")
    .select("id")
    .eq("id_usuario", userId);

  if (devError) {
    console.error(
      "[itemDevolucionModel] Error al obtener devoluciones del usuario:",
      devError,
    );
    throw devError;
  }

  const devolucionIds = (devoluciones ?? []).map((d) => d.id);
  if (devolucionIds.length === 0) return [];

  const { data: items, error: itemError } = await adminClient
    .from("item_devolucion")
    .select("id_copia")
    .in("id_devolucion", devolucionIds)
    .not("id_copia", "is", null);

  if (itemError) {
    console.error(
      "[itemDevolucionModel] Error al obtener copias devueltas:",
      itemError,
    );
    throw itemError;
  }

  return (items ?? []).map((i) => i.id_copia as string);
}
