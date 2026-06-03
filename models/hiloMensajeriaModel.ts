import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import type { Paginated } from "@/lib/types/common";
import type {
  HiloMensajeriaRow,
  HiloListItem,
  HiloWithRespuestas,
  HiloUsuarioInfo,
  UltimaRespuestaInfo,
  RespuestaEnHilo,
  InsertHiloMensajeriaPayload,
  EstadoHilo,
  HiloStats,
} from "@/lib/types/hiloMensajeria";
import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

// ─── Helpers privados ───────────────────────────────────────────────

function getNow(): string {
  return new Date().toISOString();
}

interface HiloWithRelations {
  id: string;
  titulo: string;
  mensaje: string;
  estado: EstadoHilo;
  fecha_creacion: string;
  id_usuario: string | null;
  ultima_lectura_admin: string | null;
  ultima_lectura_cliente: string | null;
  usuario: HiloUsuarioInfo | null;
}

interface RespuestaRaw {
  id: string;
  mensaje: string;
  fecha_creacion: string;
  id_usuario: string | null;
  usuario: { nombres: string | null; apellidos: string | null; id: string } | null;
}

function normalizeUsuario(
  usuario: { nombres: string | null; apellidos: string | null } | null
): HiloUsuarioInfo | null {
  if (!usuario) return null;
  return { nombres: usuario.nombres, apellidos: usuario.apellidos };
}

function normalizeRespuesta(
  row: RespuestaRaw,
  adminIds: Set<string>
): RespuestaEnHilo {
  const nombre = row.usuario
    ? [row.usuario.nombres, row.usuario.apellidos].filter(Boolean).join(" ") || "Usuario"
    : "Usuario";
  return {
    id: row.id,
    mensaje: row.mensaje,
    fecha_creacion: row.fecha_creacion,
    id_usuario: row.id_usuario,
    autor_nombre: nombre,
    es_admin: row.id_usuario ? adminIds.has(row.id_usuario) : false,
  };
}

// ─── Escritura ──────────────────────────────────────────────────────

/**
 * Crea un nuevo hilo de mensajería.
 * Retorna el ID del hilo creado.
 */
export async function createHilo(
  input: InsertHiloMensajeriaPayload
): Promise<string> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("hilo_mensajeria")
    .insert(input)
    .select("id")
    .single();

  if (error) {
    console.error("[hiloMensajeriaModel] Error creando hilo:", error);
    throw error;
  }

  return data.id;
}

/**
 * Actualiza el estado de un hilo (abierto/cerrado).
 */
export async function updateHiloEstado(
  id: string,
  estado: EstadoHilo
): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("hilo_mensajeria")
    .update({ estado })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[hiloMensajeriaModel] Error actualizando estado del hilo:", error);
    throw error;
  }
}

/**
 * Marca la última lectura de un admin en un hilo.
 */
export async function updateUltimaLecturaAdmin(id: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("hilo_mensajeria")
    .update({ ultima_lectura_admin: getNow() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[hiloMensajeriaModel] Error actualizando ultima_lectura_admin:", error);
    throw error;
  }
}

/**
 * Marca la última lectura de un cliente en un hilo.
 */
export async function updateUltimaLecturaCliente(id: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("hilo_mensajeria")
    .update({ ultima_lectura_cliente: getNow() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[hiloMensajeriaModel] Error actualizando ultima_lectura_cliente:", error);
    throw error;
  }
}

/**
 * Soft delete de un hilo.
 */
export async function softDeleteHilo(id: string): Promise<void> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("hilo_mensajeria")
    .update({ deleted_at: getNow() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    console.error("[hiloMensajeriaModel] Error eliminando hilo:", error);
    throw error;
  }
}

// ─── Lectura individual ─────────────────────────────────────────────

/**
 * Obtiene un hilo por su ID (sin soft-deleted).
 */
export async function getHiloById(
  id: string
): Promise<HiloMensajeriaRow | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("hilo_mensajeria")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[hiloMensajeriaModel] Error obteniendo hilo por id:", error);
    throw error;
  }

  return data;
}

/**
 * Obtiene un hilo con todas sus respuestas ordenadas cronológicamente.
 * Incluye datos del usuario y determina si cada respuesta es de admin.
 */
export async function getHiloWithRespuestas(
  hiloId: string,
  adminIds: Set<string>
): Promise<HiloWithRespuestas | null> {
  const adminClient = createAdminClient();

  const { data: hilo, error: hiloError } = await adminClient
    .from("hilo_mensajeria")
    .select(`
      id, titulo, mensaje, estado, fecha_creacion, id_usuario,
      usuario (nombres, apellidos)
    `)
    .eq("id", hiloId)
    .is("deleted_at", null)
    .maybeSingle();

  if (hiloError) {
    console.error("[hiloMensajeriaModel] Error obteniendo hilo:", hiloError);
    throw hiloError;
  }

  if (!hilo) return null;

  const { data: respuestas, error: respuestasError } = await adminClient
    .from("respuesta")
    .select(`
      id, mensaje, fecha_creacion, id_usuario,
      usuario (nombres, apellidos, id)
    `)
    .eq("id_hilo", hiloId)
    .is("deleted_at", null)
    .order("fecha_creacion", { ascending: true });

  if (respuestasError) {
    console.error("[hiloMensajeriaModel] Error obteniendo respuestas:", respuestasError);
    throw respuestasError;
  }

  const usuarioData = hilo.usuario as unknown as HiloUsuarioInfo | null;

  return {
    id: hilo.id,
    titulo: hilo.titulo,
    mensaje: hilo.mensaje,
    estado: hilo.estado as EstadoHilo,
    fecha_creacion: hilo.fecha_creacion,
    id_usuario: hilo.id_usuario,
    usuario: normalizeUsuario(usuarioData),
    respuestas: (respuestas ?? []).map((r) =>
      normalizeRespuesta(r as unknown as RespuestaRaw, adminIds)
    ),
  };
}

// ─── Lectura paginada ──────────────────────────────────────────────

/**
 * Obtiene los hilos de un usuario con paginación y filtro por estado.
 * Incluye conteo de respuestas y última respuesta.
 */
export async function getHilosByUsuario(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  filtroEstado?: EstadoHilo,
  esAdmin: boolean = false,
  adminIds?: Set<string>
): Promise<Paginated<HiloListItem>> {
  const adminClient = createAdminClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = adminClient
    .from("hilo_mensajeria")
    .select("id, titulo, mensaje, estado, fecha_creacion, id_usuario, ultima_lectura_admin, ultima_lectura_cliente, usuario(nombres, apellidos)", { count: "exact" })
    .is("deleted_at", null);

  if (!esAdmin) {
    query = query.eq("id_usuario", userId);
  }

  if (filtroEstado) {
    query = query.eq("estado", filtroEstado);
  }

  query = query
    .order("fecha_creacion", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[hiloMensajeriaModel] Error obteniendo hilos:", error);
    throw error;
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePageSize);
  const resolvedAdminIds = adminIds ?? new Set<string>();

  const items: HiloListItem[] = await Promise.all(
    (data ?? []).map(async (hilo) => {
      const { count: totalRespuestas } = await adminClient
        .from("respuesta")
        .select("id", { count: "exact", head: true })
        .eq("id_hilo", hilo.id)
        .is("deleted_at", null);

      const { data: ultimaResp } = await adminClient
        .from("respuesta")
        .select("mensaje, fecha_creacion, id_usuario")
        .eq("id_hilo", hilo.id)
        .is("deleted_at", null)
        .order("fecha_creacion", { ascending: false })
        .limit(1)
        .maybeSingle();

      const ultimaRespuesta: UltimaRespuestaInfo | null = ultimaResp
        ? {
            mensaje: ultimaResp.mensaje,
            fecha_creacion: ultimaResp.fecha_creacion,
            es_admin: ultimaResp.id_usuario ? resolvedAdminIds.has(ultimaResp.id_usuario) : false,
          }
        : null;

      const usuarioData = hilo.usuario as unknown as HiloUsuarioInfo | null;

      const ultimaFecha = ultimaResp
        ? new Date(ultimaResp.fecha_creacion).getTime()
        : new Date(hilo.fecha_creacion).getTime();

      let tieneNuevoMensaje = false;
      if (esAdmin) {
        if (hilo.ultima_lectura_admin) {
          tieneNuevoMensaje = ultimaFecha > new Date(hilo.ultima_lectura_admin).getTime();
        } else {
          tieneNuevoMensaje = true;
        }
      } else {
        if (hilo.ultima_lectura_cliente) {
          tieneNuevoMensaje = ultimaFecha > new Date(hilo.ultima_lectura_cliente).getTime();
        }
      }

      return {
        id: hilo.id,
        titulo: hilo.titulo,
        mensaje: hilo.mensaje,
        estado: hilo.estado as EstadoHilo,
        fecha_creacion: hilo.fecha_creacion,
        id_usuario: hilo.id_usuario,
        total_respuestas: totalRespuestas ?? 0,
        ultima_respuesta: ultimaRespuesta,
        tiene_nuevo_mensaje: tieneNuevoMensaje,
        usuario: normalizeUsuario(usuarioData),
      };
    })
  );

  return {
    data: items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

/**
 * Obtiene los IDs de todos los administradores.
 */
export async function getAdminIds(): Promise<Set<string>> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("vista_administradores")
    .select("id");

  if (error) {
    console.error("[hiloMensajeriaModel] Error obteniendo admin ids:", error);
    throw error;
  }

  return new Set((data ?? []).map((a) => a.id).filter((id): id is string => id !== null));
}

// ─── Conteos ───────────────────────────────────────────────────────

/**
 * Cuenta hilos por estado para un usuario específico o todos.
 */
export async function countHilosByEstado(
  userId?: string
): Promise<HiloStats> {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("hilo_mensajeria")
    .select("estado", { count: "exact" })
    .is("deleted_at", null);

  if (userId) {
    query = query.eq("id_usuario", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[hiloMensajeriaModel] Error contando hilos:", error);
    throw error;
  }

  const stats: HiloStats = {
    total: data?.length ?? 0,
    abiertos: data?.filter((h) => h.estado === "abierto").length ?? 0,
    cerrados: data?.filter((h) => h.estado === "cerrado").length ?? 0,
    no_leidos: 0,
  };

  return stats;
}

/**
 * Cuenta hilos con mensajes nuevos para un admin.
 * Un hilo tiene mensajes nuevos si:
 * - Fue creado después de la última lectura del admin, O
 * - Tiene respuestas posteriores a ultima_lectura_admin
 */
export async function countHilosNoLeidosAdmin(): Promise<number> {
  const adminClient = createAdminClient();

  const { data: hilos, error } = await adminClient
    .from("hilo_mensajeria")
    .select("id, fecha_creacion, ultima_lectura_admin")
    .is("deleted_at", null);

  if (error) {
    console.error("[hiloMensajeriaModel] Error obteniendo hilos para conteo admin:", error);
    throw error;
  }

  if (!hilos || hilos.length === 0) return 0;

  let noLeidos = 0;

  for (const hilo of hilos) {
    const ultimaLectura = hilo.ultima_lectura_admin ?? "1970-01-01";

    const hiloCreadoDespues = new Date(hilo.fecha_creacion).getTime() > new Date(ultimaLectura).getTime();

    if (hiloCreadoDespues) {
      noLeidos++;
      continue;
    }

    const { count } = await adminClient
      .from("respuesta")
      .select("id", { count: "exact", head: true })
      .eq("id_hilo", hilo.id)
      .is("deleted_at", null)
      .gt("fecha_creacion", ultimaLectura);

    if (count && count > 0) {
      noLeidos++;
    }
  }

  return noLeidos;
}

/**
 * Cuenta hilos con mensajes nuevos para un cliente.
 * Un hilo tiene mensajes nuevos si tiene respuestas de admin
 * posteriores a la última lectura del cliente.
 */
export async function countHilosNoLeidosCliente(
  userId: string
): Promise<number> {
  const adminClient = createAdminClient();

  const { data: hilos, error } = await adminClient
    .from("hilo_mensajeria")
    .select("id, ultima_lectura_cliente")
    .is("deleted_at", null)
    .eq("id_usuario", userId);

  if (error) {
    console.error("[hiloMensajeriaModel] Error obteniendo hilos para conteo cliente:", error);
    throw error;
  }

  if (!hilos || hilos.length === 0) return 0;

  let noLeidos = 0;

  for (const hilo of hilos) {
    const ultimaLectura = hilo.ultima_lectura_cliente ?? "1970-01-01";

    const { count } = await adminClient
      .from("respuesta")
      .select("id", { count: "exact", head: true })
      .eq("id_hilo", hilo.id)
      .is("deleted_at", null)
      .gt("fecha_creacion", ultimaLectura);

    if (count && count > 0) {
      noLeidos++;
    }
  }

  return noLeidos;
}
