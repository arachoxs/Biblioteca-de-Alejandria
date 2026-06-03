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
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        errors: { form: "Debes iniciar sesión para responder." },
        message: "Sesión requerida.",
      };
    }

    const hilo = await getHiloById(hiloId);
    if (!hilo) {
      return {
        success: false,
        errors: { form: "El hilo no existe." },
        message: "Hilo no encontrado.",
      };
    }

    if (hilo.id_usuario !== user.id) {
      return {
        success: false,
        errors: { form: "No tienes permiso para responder a este hilo." },
        message: "Sin permiso.",
      };
    }

    if (hilo.estado === "cerrado") {
      return {
        success: false,
        errors: { form: "Este hilo está cerrado. No se pueden agregar más respuestas." },
        message: "Hilo cerrado.",
      };
    }

    if (!mensaje.trim()) {
      return {
        success: false,
        errors: { form: "El mensaje no puede estar vacío." },
        message: "Mensaje vacío.",
      };
    }

    await createRespuesta({
      id_hilo: hiloId,
      id_usuario: user.id,
      mensaje: mensaje.trim(),
    });

    await updateUltimaLecturaCliente(hiloId);

    return {
      success: true,
      message: "Respuesta enviada exitosamente.",
    };
  } catch (error) {
    console.error("[mensajeriaService] Error al agregar respuesta (cliente):", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo enviar la respuesta.",
    };
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
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        errors: { form: "Debes iniciar sesión para responder." },
        message: "Sesión requerida.",
      };
    }

    const hilo = await getHiloById(hiloId);
    if (!hilo) {
      return {
        success: false,
        errors: { form: "El hilo no existe." },
        message: "Hilo no encontrado.",
      };
    }

    if (hilo.estado === "cerrado") {
      return {
        success: false,
        errors: { form: "Este hilo está cerrado. No se pueden agregar más respuestas." },
        message: "Hilo cerrado.",
      };
    }

    if (!mensaje.trim()) {
      return {
        success: false,
        errors: { form: "El mensaje no puede estar vacío." },
        message: "Mensaje vacío.",
      };
    }

    await createRespuesta({
      id_hilo: hiloId,
      id_usuario: user.id,
      mensaje: mensaje.trim(),
    });

    await updateUltimaLecturaAdmin(hiloId);

    return {
      success: true,
      message: "Respuesta enviada exitosamente.",
    };
  } catch (error) {
    console.error("[mensajeriaService] Error al agregar respuesta (admin):", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo enviar la respuesta.",
    };
  }
}

/**
 * Cierra un hilo (admin). Cualquier admin puede cerrar cualquier hilo.
 */
export async function cerrarHiloAdmin(
  hiloId: string
): Promise<ActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const hilo = await getHiloById(hiloId);
    if (!hilo) {
      return {
        success: false,
        errors: { form: "El hilo no existe." },
        message: "Hilo no encontrado.",
      };
    }

    if (hilo.estado === "cerrado") {
      return {
        success: false,
        errors: { form: "El hilo ya está cerrado." },
        message: "Hilo ya cerrado.",
      };
    }

    await updateHiloEstado(hiloId, "cerrado");

    return {
      success: true,
      message: "Hilo cerrado exitosamente.",
    };
  } catch (error) {
    console.error("[mensajeriaService] Error al cerrar hilo (admin):", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo cerrar el hilo.",
    };
  }
}

/**
 * Reabre un hilo (admin). Solo admins pueden reabrir hilos cerrados.
 */
export async function reabrirHiloAdmin(
  hiloId: string
): Promise<ActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const hilo = await getHiloById(hiloId);
    if (!hilo) {
      return {
        success: false,
        errors: { form: "El hilo no existe." },
        message: "Hilo no encontrado.",
      };
    }

    if (hilo.estado === "abierto") {
      return {
        success: false,
        errors: { form: "El hilo ya está abierto." },
        message: "Hilo ya abierto.",
      };
    }

    await updateHiloEstado(hiloId, "abierto");

    return {
      success: true,
      message: "Hilo reabierto exitosamente.",
    };
  } catch (error) {
    console.error("[mensajeriaService] Error al reabrir hilo (admin):", error);
    return {
      success: false,
      errors: { form: getErrorMessage(error) },
      message: "No se pudo reabrir el hilo.",
    };
  }
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
  return getHilosByUsuario(user.id, page, pageSize, filtroEstado, false, adminIds);
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
  return getHilosByUsuario("", page, pageSize, filtroEstado, true, adminIds);
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
