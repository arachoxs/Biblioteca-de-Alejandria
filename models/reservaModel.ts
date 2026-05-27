import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type {
  InsertReservaPayload,
  ReservaRow,
  ReservaWithDetails,
} from "@/lib/types/reserva";

// ─── Domain Types ────────────────────────────────────────────────────

interface ActiveReservaFilters {
  userId: string
  libroId?: string
  tiendaId?: string
}

interface ReservaByIdFilter {
  id: string
}

interface ReservaQuery {
  userId: string
  libroIds: string[]
}

// ─── Helpers privados ───────────────────────────────────────────────

/** Obtiene la fecha actual en formato ISO. Centralizado para evitar duplicación. */
function getNow(): string {
  return new Date().toISOString();
}

/** Tipos para результат consultas con copia joineada */
interface ReservaWithCopiaFields {
  id: string;
  created_at: string;
  fecha_expiracion: string;
  id_copia: string;
  id_usuario: string;
  copia: { id: string; id_libro: string; id_tienda?: string } | null;
}

/**
 * Normaliza el resultado de una consulta de reserva con copia join,
 * extrayendo solo los campos de ReservaRow.
 */
function normalizeReservaRow(
  data: ReservaWithCopiaFields | null,
  libroId: string | undefined,
  tiendaId?: string,
): ReservaRow | null {
  if (!data?.copia) return null;

  const matchesLibro = libroId !== undefined ? data.copia.id_libro === libroId : true;
  const matchesTienda = tiendaId !== undefined
    ? data.copia.id_tienda === tiendaId
    : true;

  if (matchesLibro && matchesTienda) {
    return {
      id: data.id,
      created_at: data.created_at,
      fecha_expiracion: data.fecha_expiracion,
      id_copia: data.id_copia,
      id_usuario: data.id_usuario,
    };
  }

  return null;
}

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
  const now = getNow();

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

/**
 * Elimina reservas activas por usuario y copias específicas.
 */
export async function deleteReservasByUserAndCopias(
  userId: string,
  copiaIds: string[],
): Promise<void> {
  if (copiaIds.length === 0) return;

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("reserva")
    .delete()
    .eq("id_usuario", userId)
    .in("id_copia", copiaIds);

  if (error) {
    console.error("[reservaModel] Error eliminando reservas por usuario y copias:", error);
    throw error;
  }
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
  const now = getNow();

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
  userId: string,
): Promise<Map<string, string[]>> {
  return queryReservasByUserAndLibroIds({ userId, libroIds: [] })
}

// ─── Query helpers with domain types ────────────────────────────────

async function queryActiveReservaWithFilters(
  filters: ActiveReservaFilters,
  useMaybeSingle: boolean = false,
): Promise<ReservaRow | null> {
  const adminClient = createAdminClient()
  const now = getNow()

  const base = adminClient
    .from("reserva")
    .select("id, created_at, fecha_expiracion, id_copia, id_usuario, copia(id, id_libro, id_tienda)")
    .eq("id_usuario", filters.userId)
    .gt("fecha_expiracion", now)
    .limit(1)

  let data: ReservaWithCopiaFields | null = null
  let error: unknown = null

  if (useMaybeSingle) {
    const result = await base.maybeSingle()
    data = result.data
    error = result.error
  } else {
    const result = await base.single()
    data = result.data
    error = result.error
  }

  if (error) {
    console.error("[reservaModel] Error en queryActiveReservaWithFilters:", error)
    throw error
  }

  return normalizeReservaRow(data, filters.libroId, filters.tiendaId)
}

async function queryActiveReservaOfBook(
  userId: string,
  libroId: string,
): Promise<ReservaRow | null> {
  const adminClient = createAdminClient()
  const now = getNow()

  const { data, error } = await adminClient
    .from("reserva")
    .select("id, created_at, fecha_expiracion, id_copia, id_usuario, copia(id, id_libro)")
    .eq("id_usuario", userId)
    .gt("fecha_expiracion", now)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[reservaModel] Error en queryActiveReservaOfBook:", error)
    throw error
  }

  return normalizeReservaRow(data as ReservaWithCopiaFields | null, libroId)
}

async function queryReservasByUserAndLibroIds(
  filters: ReservaQuery,
): Promise<Map<string, string[]>> {
  const adminClient = createAdminClient()
  const now = getNow()

  const { data, error } = await adminClient
    .from("reserva")
    .select("id_copia, copia!inner ( id_libro )")
    .eq("id_usuario", filters.userId)
    .gt("fecha_expiracion", now)

  if (error) {
    console.error("[reservaModel] Error en queryReservasByUserAndLibroIds:", error)
    throw error
  }

  const byLibro = new Map<string, string[]>()

  for (const row of (data ?? []) as { id_copia: string; copia: { id_libro: string } | null }[]) {
    const libroId = row.copia?.id_libro
    if (!libroId) continue
    const existing = byLibro.get(libroId)
    if (existing) {
      existing.push(row.id_copia)
    } else {
      byLibro.set(libroId, [row.id_copia])
    }
  }

  return byLibro
}

/**
 * Verifica si el usuario ya tiene una reserva activa para un libro específico
 * en una tienda específica.
 */
export async function getActiveReservaForLibroAtTienda(
  userId: string,
  libroId: string,
  tiendaId: string,
): Promise<ReservaRow | null> {
  return queryActiveReservaWithFilters({ userId, libroId, tiendaId }, true)
}

/**
 * Obtiene la reserva activa del usuario para un libro específico (cualquier tienda).
 */
export async function getActiveReservaOfLibro(
  userId: string,
  libroId: string,
): Promise<ReservaRow | null> {
  return queryActiveReservaOfBook(userId, libroId)
}

// ─── Conteos para reglas de negocio ─────────────────────────────────

interface CountReservasFilters {
  userId: string
  copiaIds?: string[]
}

/**
 * Cuenta cuántas reservas activas (no expiradas) tiene un usuario.
 */
export async function countReservasActivasByUser(
  filters: CountReservasFilters,
): Promise<number> {
  return queryActiveReservas(filters.userId, filters.copiaIds)
}

/**
 * Cuenta cuántas reservas activas tiene un usuario para un conjunto
 * específico de IDs de copia.
 *
 * El servicio debe resolver los IDs de copia antes de llamar a esta función.
 */
export async function countReservasByUserAndCopias(
  filters: CountReservasFilters,
): Promise<number> {
  if (!filters.copiaIds || filters.copiaIds.length === 0) return 0
  return queryActiveReservas(filters.userId, filters.copiaIds)
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
  const now = getNow();

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
