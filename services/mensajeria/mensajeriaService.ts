import "server-only";

import { getErrorMessage } from "@/lib/services/errors";
import { getCurrentUser } from "@/models/authModel";
import { requireClientRole, requireAdminRole } from "@/lib/validations/server-auth";
import {
  createHilo,
  getHiloById,
  getHiloWithRespuestas,
  getHilosByUsuario,
  updateHiloEstado,
  updateUltimaLecturaAdmin,
  updateUltimaLecturaCliente,
  getAdminIds,
  countHilosNoLeidosAdmin,
  countHilosNoLeidosCliente,
  countHilosByEstado,
} from "@/models/hiloMensajeriaModel";
import { createRespuesta } from "@/models/respuestaModel";
import type {
  HiloActionResponse,
  HiloWithRespuestas,
  HiloListItem,
  HiloStats,
  EstadoHilo,
} from "@/lib/types/hiloMensajeria";
import type { Paginated, ActionResponse } from "@/lib/types/common";
import { Rol } from "@/lib/types/auth";

// ─── Helpers de validación ─────────────────────────────────────────

function errorResponse(message: string): ActionResponse {
  return { success: false, errors: { form: message }, message };
}

async function requireUser() {
  const user = await getCurrentUser();
  return user ? { user, error: null } : { user: null, error: errorResponse("Debes iniciar sesión.") };
}

async function getHiloOrError(hiloId: string) {
  const hilo = await getHiloById(hiloId);
  return hilo ? { hilo, error: null } : { hilo: null, error: errorResponse("El hilo no existe.") };
}

function validateMensajeNoVacio(mensaje: string): ActionResponse | null {
  if (!mensaje.trim()) return errorResponse("El mensaje no puede estar vacío.");
  return null;
}

function validateHiloAbierto(hilo: { estado: string }): ActionResponse | null {
  if (hilo.estado === "cerrado") return errorResponse("Este hilo está cerrado.");
  return null;
}

async function enviarRespuesta(
  hiloId: string,
  mensaje: string,
  userId: string,
  updateLectura: (id: string) => Promise<void>
): Promise<ActionResponse> {
  const { hilo, error: hiloError } = await getHiloOrError(hiloId);
  if (hiloError) return hiloError;

  return enviarRespuestaConHilo({ hiloId, mensaje, userId, updateLectura, hilo });
}

async function enviarRespuestaConHilo(opts: {
  hiloId: string;
  mensaje: string;
  userId: string;
  updateLectura: (id: string) => Promise<void>;
  hilo: { estado: string };
}): Promise<ActionResponse> {
  const msgError = validateHiloAbierto(opts.hilo) || validateMensajeNoVacio(opts.mensaje);
  if (msgError) return msgError;

  await createRespuesta({
    id_hilo: opts.hiloId,
    id_usuario: opts.userId,
    mensaje: opts.mensaje.trim(),
  });

  await opts.updateLectura(opts.hiloId);

  return { success: true, message: "Respuesta enviada exitosamente." };
}

// ─── Operaciones de cliente ────────────────────────────────────────

/**
 * Crea un nuevo hilo de mensajería para el usuario actual.
 * El primer mensaje se almacena como mensaje del hilo.
 */
export async function crearHilo(
  titulo: string,
  mensaje: string
): Promise<HiloActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        errors: { form: "Debes iniciar sesión para crear un hilo." },
        message: "Sesión requerida.",
      };
    }

    if (!titulo.trim() || !mensaje.trim()) {
      return {
        success: false,
        errors: { form: "El título y el mensaje son obligatorios." },
        message: "Datos incompletos.",
      };
    }

    const hiloId = await createHilo({
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      id_usuario: user.id,
      estado: "abierto",
    });

    return {
      success: true,
      message: "Hilo creado exitosamente.",
    };
  } catch (error) {
    console.error("[mensajeriaService] Error al crear hilo:", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo crear el hilo.",
    };
  }
}

/**
 * Agrega una respuesta a un hilo existente (cliente).
 * Solo el propietario del hilo puede responder.
 */
export async function agregarRespuestaCliente(
  hiloId: string,
  mensaje: string
): Promise<ActionResponse> {
  const roleCheck = await requireClientRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const { user, error: userError } = await requireUser();
    if (userError) return userError;

    const { hilo, error: hiloError } = await getHiloOrError(hiloId);
    if (hiloError) return hiloError;

    if (hilo.id_usuario !== user.id) {
      return errorResponse("No tienes permiso para responder a este hilo.");
    }

    return await enviarRespuestaConHilo({ hiloId, mensaje, userId: user.id, updateLectura: updateUltimaLecturaCliente, hilo });
  } catch (error) {
    console.error("[mensajeriaService] Error al agregar respuesta (cliente):", error);
    return { success: false, errors: { form: getErrorMessage(error) }, message: "No se pudo enviar la respuesta." };
  }
}

// ─── Operaciones de administrador ──────────────────────────────────

/**
 * Agrega una respuesta a un hilo (admin).
 * Cualquier admin puede responder cualquier hilo.
 */
export async function agregarRespuestaAdmin(
  hiloId: string,
  mensaje: string
): Promise<ActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const { user, error: userError } = await requireUser();
    if (userError) return userError;

    return await enviarRespuesta(hiloId, mensaje, user.id, updateUltimaLecturaAdmin);
  } catch (error) {
    console.error("[mensajeriaService] Error al agregar respuesta (admin):", error);
    return { success: false, errors: { form: getErrorMessage(error) }, message: "No se pudo enviar la respuesta." };
  }
}

async function cambiarEstadoHilo(
  hiloId: string,
  estadoActual: EstadoHilo,
  nuevoEstado: EstadoHilo,
  accionVerbo: string
): Promise<ActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const { hilo, error: hiloError } = await getHiloOrError(hiloId);
    if (hiloError) return hiloError;

    if (hilo.estado === nuevoEstado) {
      return errorResponse(`El hilo ya está ${nuevoEstado === "cerrado" ? "cerrado" : "abierto"}.`);
    }

    await updateHiloEstado(hiloId, nuevoEstado);

    return { success: true, message: `Hilo ${accionVerbo} exitosamente.` };
  } catch (error) {
    console.error(`[mensajeriaService] Error al ${accionVerbo} hilo:`, error);
    return { success: false, errors: { form: getErrorMessage(error) }, message: `No se pudo ${accionVerbo} el hilo.` };
  }
}

export async function cerrarHiloAdmin(hiloId: string): Promise<ActionResponse> {
  return cambiarEstadoHilo(hiloId, "abierto", "cerrado", "cerrado");
}

export async function reabrirHiloAdmin(hiloId: string): Promise<ActionResponse> {
  return cambiarEstadoHilo(hiloId, "cerrado", "abierto", "reabierto");
}

// ─── Consultas ─────────────────────────────────────────────────────

/**
 * Obtiene los hilos del usuario actual con paginación y filtro.
 */
export async function getMisHilos(
  page: number = 1,
  pageSize: number = 10,
  filtroEstado?: EstadoHilo
): Promise<Paginated<HiloListItem>> {
  const user = await getCurrentUser();
  if (!user) {
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const adminIds = await getAdminIds();
  return getHilosByUsuario({ userId: user.id, page, pageSize, filtroEstado, adminIds });
}

/**
 * Obtiene todos los hilos para administradores con paginación y filtro.
 */
export async function getAllHilosAdmin(
  page: number = 1,
  pageSize: number = 10,
  filtroEstado?: EstadoHilo
): Promise<Paginated<HiloListItem>> {
  const adminIds = await getAdminIds();
  return getHilosByUsuario({ page, pageSize, filtroEstado, esAdmin: true, adminIds });
}

/**
 * Obtiene un hilo con todas sus respuestas.
 * Marca el hilo como leído según el rol del usuario.
 */
export async function getHiloDetalle(
  hiloId: string
): Promise<HiloWithRespuestas | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const adminIds = await getAdminIds();
  const hilo = await getHiloWithRespuestas(hiloId, adminIds);
  if (!hilo) return null;

  const esAdmin = adminIds.has(user.id);

  if (esAdmin) {
    await updateUltimaLecturaAdmin(hiloId);
  } else if (hilo.id_usuario === user.id) {
    await updateUltimaLecturaCliente(hiloId);
  }

  return hilo;
}

/**
 * Obtiene estadísticas de hilos para el usuario actual.
 */
export async function getStatsCliente(): Promise<HiloStats> {
  const user = await getCurrentUser();
  if (!user) {
    return { total: 0, abiertos: 0, cerrados: 0, no_leidos: 0 };
  }

  const stats = await countHilosByEstado(user.id);
  stats.no_leidos = await countHilosNoLeidosCliente(user.id);

  return stats;
}

/**
 * Obtiene estadísticas de hilos para administradores.
 */
export async function getStatsAdmin(): Promise<HiloStats> {
  const stats = await countHilosByEstado();
  stats.no_leidos = await countHilosNoLeidosAdmin();

  return stats;
}

/**
 * Obtiene el conteo de mensajes no leídos para el badge del navbar.
 */
export async function getContadorNoLeidos(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const adminIds = await getAdminIds();
  const esAdmin = adminIds.has(user.id);

  if (esAdmin) {
    return countHilosNoLeidosAdmin();
  }

  return countHilosNoLeidosCliente(user.id);
}
