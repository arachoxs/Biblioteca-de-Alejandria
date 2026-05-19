import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type {
  InsertReservaPayload,
  ReservaRow,
  ReservaWithDetails,
} from "@/lib/types/reserva";

// ─── Escritura ──────────────────────────────────────────────────────

/**
 * Crea una reserva para una copia y un usuario.
 * `fecha_expiracion` se establece automáticamente via DEFAULT de BD.
 * Retorna el ID de la reserva creada.
 */
export async function createReserva(
  input: InsertReservaPayload,
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("reserva")
    .insert({
      id_copia: input.id_copia,
      id_usuario: input.id_usuario,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[reservaModel] Error creando reserva:", error);
    throw error;
  }

  return data.id;
}

/**
 * Crea múltiples reservas en una sola operación.
 * Retorna los IDs de las reservas creadas.
 */
export async function createReservasBatch(
  inputs: InsertReservaPayload[],
): Promise<string[]> {
  if (inputs.length === 0) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("reserva")
    .insert(inputs)
    .select("id");

  if (error) {
    console.error("[reservaModel] Error creando reservas en batch:", error);
    throw error;
  }

  return (data ?? []).map((r) => r.id);
}

/**
 * Elimina una reserva por su ID.
 * Delete físico — solo reservas activas.
 */
export async function deleteReserva(id: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("reserva")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[reservaModel] Error eliminando reserva:", error);
    throw error;
  }
}

/**
 * Elimina múltiples reservas por sus IDs en una sola operación.
 * Utilizado por el batch de limpieza de expiradas.
 */
export async function deleteReservasBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("reserva")
    .delete()
    .in("id", ids);

  if (error) {
    console.error(
      "[reservaModel] Error eliminando reservas en batch:",
      error,
    );
    throw error;
  }
}

// ─── Lectura individual ─────────────────────────────────────────────

/**
 * Obtiene una reserva por su ID (sin filtrar expiración).
 */
export async function getReservaById(id: string): Promise<ReservaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("reserva")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[reservaModel] Error obteniendo reserva por id:", error);
    throw error;
  }

  return data;
}

// ─── Lectura por usuario ────────────────────────────────────────────

/**
 * Obtiene todas las reservas activas de un usuario con joins
 * a copia, libro y autor. Sin paginación — para agrupar en el servicio.
 */
export async function getActiveReservasConLibro(
  id_usuario: string,
): Promise<ReservaWithDetails[]> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("reserva")
    .select(
      `
      id,
      created_at,
      fecha_expiracion,
      id_copia,
      id_usuario,
      copia (
        id,
        codigo_seq,
        estado,
        libro (
          id,
          titulo,
          isbn,
          precio,
          autor ( nombre )
        ),
        tienda (
          id,
          nombre
        )
      )
    `,
    )
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo reservas con libro:",
      error,
    );
    throw error;
  }

  return (data ?? []) as unknown as ReservaWithDetails[];
}

// ─── Conteos para reglas de negocio ─────────────────────────────────

/**
 * Cuenta cuántas reservas activas (no expiradas) tiene un usuario.
 */
export async function countReservasActivasByUser(
  id_usuario: string,
): Promise<number> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { count, error } = await adminClient
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now);

  if (error) {
    console.error(
      "[reservaModel] Error contando reservas activas del usuario:",
      error,
    );
    throw error;
  }

  return count ?? 0;
}

/**
 * Cuenta cuántas reservas activas tiene un usuario para un conjunto
 * específico de IDs de copia.
 *
 * El servicio debe resolver los IDs de copia antes de llamar a esta función.
 */
export async function countReservasByUserAndCopias(
  id_usuario: string,
  copiaIds: string[],
): Promise<number> {
  if (copiaIds.length === 0) return 0;

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { count, error } = await adminClient
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("id_usuario", id_usuario)
    .in("id_copia", copiaIds)
    .gt("fecha_expiracion", now);

  if (error) {
    console.error(
      "[reservaModel] Error contando reservas por usuario y copias:",
      error,
    );
    throw error;
  }

  return count ?? 0;
}

// ─── Batch de expiración ────────────────────────────────────────────

/**
 * Obtiene las reservas expiradas (fecha_expiracion < now())
 * con solo los campos necesarios para liberarlas.
 */
export async function getReservasExpiradas(): Promise<
  Pick<ReservaRow, "id" | "id_copia">[]
> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("reserva")
    .select("id, id_copia")
    .lt("fecha_expiracion", now);

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo reservas expiradas:",
      error,
    );
    throw error;
  }

  return data ?? [];
}
