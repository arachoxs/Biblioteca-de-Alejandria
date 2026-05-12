import { createAdminClient } from "@/lib/supabase/server";
import type {
  Paginated,
  DataResponseArray,
} from "@/lib/types/common";
import type { Database } from "@/lib/types/supabase";
import type {
  InsertTiendaPayload,
  TiendaRead,
  TiendaRow,
  TiendaWithDireccion,
  UpdateTiendaPayload,
  TiendaGlobal,
} from "@/lib/types/tienda";
import { escapeLikePattern, formatILIKE } from "@/lib/validations/db-utils";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

type TiendaListRow = TiendaRow & {
  direccion: Pick<
    Database["public"]["Tables"]["direccion"]["Row"],
    "direccion_formateada" | "place_id"
  > | null;
};

const TIENDA_BASE_COLUMNS =
  "id, nombre, horario, id_direccion, es_bodega, deleted_at";

function normalizeTiendaRow(row: TiendaRow): TiendaRead {
  return {
    id: row.id,
    nombre: row.nombre,
    horario: row.horario as unknown as TiendaRead["horario"],
    id_direccion: row.id_direccion,
    es_bodega: row.es_bodega,
    deleted_at: row.deleted_at,
  };
}

function normalizeTiendaWithDireccion(row: TiendaListRow): TiendaWithDireccion {
  return {
    ...normalizeTiendaRow(row),
    direccion_formateada: row.direccion?.direccion_formateada ?? "",
    direccion_place_id: row.direccion?.place_id ?? "",
  };
}

/**
 * Inserta una nueva tienda en la tabla `tienda`.
 */
export async function createTienda(
  input: InsertTiendaPayload,
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .insert({
      nombre: input.nombre,
      horario:
        input.horario as unknown as Database["public"]["Tables"]["tienda"]["Insert"]["horario"],
      id_direccion: input.id_direccion,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[tiendaModel] Error al crear tienda:", error);
    throw error;
  }

  return data.id;
}

/**
 * Obtiene tiendas activas paginadas para el panel administrativo.
 */
export async function getTiendas(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string,
): Promise<Paginated<TiendaWithDireccion>> {
  const adminClient = createAdminClient();

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("tienda")
    .select(
      `${TIENDA_BASE_COLUMNS}, direccion (direccion_formateada, place_id)`,
      {
        count: "exact",
      },
    )
    .is("deleted_at", null)
    .is("es_bodega", false)
    .range(from, to)
    .order("nombre", { ascending: true });

  if (searchTerm && searchTerm.trim() !== "") {
    query = query.ilike("nombre", formatILIKE(searchTerm));
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[tiendaModel] Error al obtener tiendas:", error);
    throw error;
  }

  const normalized = (data ?? []).map((row) =>
    normalizeTiendaWithDireccion(row as TiendaListRow),
  );
  const totalCount = count ?? 0;

  return {
    data: normalized,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

// obtener todas las tiendas para las mostrar listas (traslado , inventario , etc..)

export async function getAllActiveTiendas(): Promise<
  DataResponseArray<TiendaGlobal>
> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .select("id, nombre")
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("[tiendaModel] Error al obtener todas las tiendas:", error);
    throw error;
  }

  const normalized = (data ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
  }));

  return {
    success: true,
    data: normalized,
  };
}

export async function getDefaultTienda(): Promise<TiendaGlobal | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .select("id, nombre")
    .is("es_bodega", true)
    .is("deleted_at", null)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[tiendaModel] Error al obtener tienda por defecto:", error);
    throw error;
  }

  return data ? { id: data.id, nombre: data.nombre } : null;
}

/**
 * Construye el payload para actualizar una tienda.
 */
function buildTiendaUpdatePayload(
  input: UpdateTiendaPayload,
): Database["public"]["Tables"]["tienda"]["Update"] {
  const payload: Partial<Database["public"]["Tables"]["tienda"]["Update"]> = {};
  if (input.nombre !== undefined) payload.nombre = input.nombre;
  if (input.horario !== undefined) {
    payload.horario = input.horario as unknown as Database["public"]["Tables"]["tienda"]["Update"]["horario"];
  }
  if (input.id_direccion !== undefined) payload.id_direccion = input.id_direccion;
  return payload;
}

/**
 * Actualiza una tienda activa por su ID.
 */
export async function updateTiendaById(
  tiendaId: string,
  input: UpdateTiendaPayload,
): Promise<void> {
  const adminClient = createAdminClient();

  const payload = buildTiendaUpdatePayload(input);

  if (Object.keys(payload).length === 0) {
    throw new Error("Debes enviar al menos un campo para actualizar.");
  }

  const { data, error } = await adminClient
    .from("tienda")
    .update(payload)
    .eq("id", tiendaId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("[tiendaModel] Error al actualizar tienda:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Tienda no encontrada.");
  }
}

/**
 * Realiza eliminación lógica de una tienda activa por su ID.
 */
export async function softDeleteTiendaById(
  tiendaId: string,
): Promise<void> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tiendaId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    console.error("[tiendaModel] Error al eliminar tienda:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Tienda no encontrada.");
  }
}

/**
 * Obtiene una tienda activa por su ID.
 */
export async function getActiveTiendaById(
  tiendaId: string,
): Promise<TiendaRead | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .select(TIENDA_BASE_COLUMNS)
    .eq("id", tiendaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tiendaModel] Error al obtener tienda por ID:", error);
    throw error;
  }

  return data ? normalizeTiendaRow(data as TiendaRow) : null;
}

/**
 * Obtiene una o varias tiendas activas por sus IDs.
 */
export async function getActiveTiendasByIds(
  tiendaIds: string[],
): Promise<TiendaRead[]> {
  if (tiendaIds.length === 0) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("tienda")
    .select(TIENDA_BASE_COLUMNS)
    .in("id", tiendaIds)
    .is("deleted_at", null);

  if (error) {
    console.error("[tiendaModel] Error al obtener tiendas por IDs:", error);
    throw error;
  }

  return (data ?? []).map((row) => normalizeTiendaRow(row as TiendaRow));
}

/**
 * Obtiene una tienda activa por nombre exacto (case-insensitive).
 */
export async function getActiveTiendaByExactName(
  nombre: string,
): Promise<TiendaRead | null> {
  const adminClient = createAdminClient();
  const exactNamePattern = escapeLikePattern(nombre);

  const { data, error } = await adminClient
    .from("tienda")
    .select(TIENDA_BASE_COLUMNS)
    .is("deleted_at", null)
    .ilike("nombre", exactNamePattern)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[tiendaModel] Error al obtener tienda por nombre:", error);
    throw error;
  }

  return data ? normalizeTiendaRow(data as TiendaRow) : null;
}

/**
 * Obtiene una tienda activa por nombre exacto excluyendo un ID.
 */
export async function getActiveTiendaByExactNameExcludingId(
  nombre: string,
  excludedTiendaId: string,
): Promise<TiendaRead | null> {
  const adminClient = createAdminClient();
  const exactNamePattern = escapeLikePattern(nombre);

  const { data, error } = await adminClient
    .from("tienda")
    .select(TIENDA_BASE_COLUMNS)
    .is("deleted_at", null)
    .neq("id", excludedTiendaId)
    .ilike("nombre", exactNamePattern)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[tiendaModel] Error al buscar duplicado de tienda:", error);
    throw error;
  }

  return data ? normalizeTiendaRow(data as TiendaRow) : null;
}

/**
 * Retorna la cantidad de copias activas asociadas a una tienda.
 */
export async function getActiveCopyCountForTienda(
  tiendaId: string,
): Promise<number> {
  const adminClient = createAdminClient();

  const { count, error } = await adminClient
    .from("copia")
    .select("id", { count: "exact", head: true })
    .eq("id_tienda", tiendaId)
    .is("deleted_at", null);

  if (error) {
    console.error("[tiendaModel] Error al contar copias de tienda:", error);
    throw error;
  }

  return count ?? 0;
}
