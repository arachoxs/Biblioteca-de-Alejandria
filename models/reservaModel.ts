import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type {
  InsertReservaPayload,
  ReservaRow,
  ReservaWithDetails,
} from "@/lib/types/reserva";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Helper de paginación ───────────────────────────────────────────

function buildPaginationBounds(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { safePage, safePageSize, from, to };
}

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

/**
 * Busca una reserva activa (no expirada) para una copia específica.
 * Retorna la reserva o null si la copia está disponible.
 */
export async function getReservaActivaByCopia(
  id_copia: string,
): Promise<ReservaRow | null> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("reserva")
    .select("*")
    .eq("id_copia", id_copia)
    .gt("fecha_expiracion", now)
    .maybeSingle();

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo reserva activa por copia:",
      error,
    );
    throw error;
  }

  return data;
}

// ─── Lectura por usuario ────────────────────────────────────────────

/**
 * Obtiene todas las reservas activas (no expiradas) de un usuario
 * sin paginación.
 */
export async function getActiveReservasByUser(
  id_usuario: string,
): Promise<ReservaRow[]> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("reserva")
    .select("*")
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now);

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo reservas activas del usuario:",
      error,
    );
    throw error;
  }

  return data ?? [];
}

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

/**
 * Obtiene las reservas activas de un usuario paginadas,
 * enriquecidas con datos de copia, libro y tienda.
 */
export async function getReservasByUserPaginated(
  id_usuario: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<Paginated<ReservaWithDetails>> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();
  const { safePage, safePageSize, from, to } = buildPaginationBounds(
    page,
    pageSize,
  );

  // Contar total de registros
  const { count, error: countError } = await adminClient
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now);

  if (countError) {
    console.error(
      "[reservaModel] Error contando reservas del usuario:",
      countError,
    );
    throw countError;
  }

  const totalCount = count ?? 0;

  // Obtener datos paginados con joins
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
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo reservas paginadas:",
      error,
    );
    throw error;
  }

  return {
    data: (data ?? []) as unknown as ReservaWithDetails[],
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
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
