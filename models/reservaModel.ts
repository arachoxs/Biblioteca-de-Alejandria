import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type {
  InsertReservaPayload,
  ReservaRow,
  ReservaWithDetails,
} from "@/lib/types/reserva";

// ─── Helpers privados ───────────────────────────────────────────────

interface BasicQueryOptions {
  /** Columnas a seleccionar (string de columnas). `null` = ejecuta delete(). */
  selectColumns?: string | null;
  /** Campo por el que filtrar (ej. "id", "id_usuario"). */
  filterField: string;
  /** Valor del filtro: string → `.eq()`, array → `.in()`. */
  filterValue: string | string[];
  /** Si es true, añade `.maybeSingle()` a la cadena. */
  maybeSingle?: boolean;
  /** Contexto para el mensaje de error: `[reservaModel] ${errorContext}:`. */
  errorContext?: string;
}

/**
 * Construye y ejecuta una consulta básica sobre la tabla `reserva`,
 * extrayendo el patrón común de creación de cliente, filtrado y manejo de errores.
 *
 * - Si `selectColumns` es `null`, ejecuta un `delete()` en lugar de `select()`.
 * - Si `filterValue` es un array, usa `.in()`; si es string, usa `.eq()`.
 * - `maybeSingle` añade `.maybeSingle()` a la cadena.
 * - `errorContext` se interpola en el mensaje de error: `[reservaModel] ${errorContext}:`.
 */
async function buildBasicQuery<T = ReservaRow>(
  client: ReturnType<typeof createAdminClient>,
  options: BasicQueryOptions,
): Promise<T | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let builder: any = client.from("reserva");

  if (options.selectColumns !== null) {
    builder = builder.select(options.selectColumns);
  } else {
    builder = builder.delete();
  }

  if (Array.isArray(options.filterValue)) {
    builder = builder.in(options.filterField, options.filterValue);
  } else {
    builder = builder.eq(options.filterField, options.filterValue);
  }

  if (options.maybeSingle) {
    builder = builder.maybeSingle();
  }

  const { data, error } = await builder;

  if (error) {
    console.error(
      `[reservaModel] ${options.errorContext ?? "Error en consulta básica"}:`,
      error,
    );
    throw error;
  }

  return data as T | null;
}

/**
 * Cuenta las reservas activas (no expiradas) de un usuario.
 * Si se proporciona `copiaIds`, filtra adicionalmente por esos IDs de copia.
 */
async function queryActiveReservas(
  id_usuario: string,
  copiaIds?: string[],
): Promise<number> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  let query = adminClient
    .from("reserva")
    .select("id", { count: "exact", head: true })
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now);

  if (copiaIds && copiaIds.length > 0) {
    query = query.in("id_copia", copiaIds);
  }

  const { count, error } = await query;

  if (error) {
    console.error("[reservaModel] Error consultando reservas activas:", error);
    throw error;
  }

  return count ?? 0;
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
  await buildBasicQuery(adminClient, {
    selectColumns: null,
    filterField: "id",
    filterValue: id,
    errorContext: "Error eliminando reserva",
  });
}

/**
 * Elimina múltiples reservas por sus IDs en una sola operación.
 * Utilizado por el batch de limpieza de expiradas.
 */
export async function deleteReservasBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const adminClient = createAdminClient();
  await buildBasicQuery(adminClient, {
    selectColumns: null,
    filterField: "id",
    filterValue: ids,
    errorContext: "Error eliminando reservas en batch",
  });
}

// ─── Lectura individual ─────────────────────────────────────────────

/**
 * Obtiene una reserva por su ID (sin filtrar expiración).
 */
export async function getReservaById(id: string): Promise<ReservaRow | null> {
  const adminClient = createAdminClient();
  return buildBasicQuery<ReservaRow>(adminClient, {
    selectColumns: "*",
    filterField: "id",
    filterValue: id,
    maybeSingle: true,
    errorContext: "Error obteniendo reserva por id",
  });
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
          autor ( nombre ),
          noticias (
            imagenes
          )
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
 * Obtiene las reservas activas de un usuario agrupadas por libro.
 * Retorna un Map<id_libro, id_copia[]>.
 *
 * Es una alternativa ligera a getActiveReservasConLibro cuando solo
 * se necesitan IDs para validar límites (5 libros, 3 copias mismo libro).
 */
export async function getActiveReservaBookIds(
  id_usuario: string,
): Promise<Map<string, string[]>> {
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("reserva")
    .select(
      `
      id_copia,
      copia!inner ( id_libro )
    `,
    )
    .eq("id_usuario", id_usuario)
    .gt("fecha_expiracion", now);

  if (error) {
    console.error(
      "[reservaModel] Error obteniendo IDs de libros de reservas:",
      error,
    );
    throw error;
  }

  const byLibro = new Map<string, string[]>();

  for (const row of (data ?? []) as {
    id_copia: string;
    copia: { id_libro: string } | null;
  }[]) {
    const libroId = row.copia?.id_libro;
    if (!libroId) continue;
    const existing = byLibro.get(libroId);
    if (existing) {
      existing.push(row.id_copia);
    } else {
      byLibro.set(libroId, [row.id_copia]);
    }
  }

  return byLibro;
}

// ─── Conteos para reglas de negocio ─────────────────────────────────

/**
 * Cuenta cuántas reservas activas (no expiradas) tiene un usuario.
 */
export async function countReservasActivasByUser(
  id_usuario: string,
): Promise<number> {
  return queryActiveReservas(id_usuario);
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
  return queryActiveReservas(id_usuario, copiaIds);
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
