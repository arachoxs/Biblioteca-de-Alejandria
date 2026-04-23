import { requireAdminRole } from "@/lib/validations/server-auth";
import {
  checkLibroDuplicateInfo,
  createLibro,
  getLibrosWithCopies,
  rollbackLibro,
  softDeleteLibroById,
  updateLibroById,
  getActiveLibroById,
} from "@/models/libroModel";
import { insertNoticia, softDeleteNoticiaByLibroId } from "@/models/noticiaModel";
import {
  deleteHistoricoByLibroId,
  insertHistorico,
  listHistoricoByLibro,
} from "@/models/historicoModel";
import { countCopiasByLibro } from "@/models/copiaModel";
import { createCopias } from "@/services/copia/copiaService";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import type {
  InsertLibroPayload,
  UpdateLibroPayload,
  LibrosListResponse,
  LibroActionResponse,
} from "@/lib/types/libro";
import type {
  HistoricoTimelineData,
  HistoricoTimelineResponse,
} from "@/lib/types/historico";
import { getCurrentUser } from "@/models/authModel";

// ─── Utilidades ────────────────────────────────────────────────────
// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Orquesta la creación de un libro sin inventario.
 */
export async function createBook(
  data: InsertLibroPayload
): Promise<LibroActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const isDuplicate = await checkLibroDuplicateInfo(
      data.titulo,
      data.isbn,
      data.estado
    );
    if (isDuplicate) {
      return {
        success: false,
        errors: { form: "Ya existe un libro con este título, ISBN y estado." },
        message: "El libro ya está registrado.",
      };
    }
  } catch (_) {
    return {
      success: false,
      message: "Error al verificar la existencia del libro.",
    };
  }

  const resultLibro = await createLibro(data);
  if (!resultLibro.success || !resultLibro.id) {
    return {
      success: false,
      message: resultLibro.error || "Error al crear el libro principal.",
    };
  }

  const libroId = String(resultLibro.id);

  try {
    // Calcular fechas
    const now = new Date();
    const expiracion = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const noticiaResult = await insertNoticia({
      id_libro: libroId,
      fecha_publicacion: now.toISOString(),
      fecha_expiracion: expiracion.toISOString(),
      es_visible: true,
    });
    if (!noticiaResult.success) throw new Error(noticiaResult.error);

    const historicoResult = await insertHistorico({
      id_libro: libroId,
      estado: "agotado",
      fecha: now.toISOString(),
    });
    if (!historicoResult.success) throw new Error(historicoResult.error);

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.CREAR,
        description: `Se creó el libro "${data.titulo}" (sin inventario).`,
        entity: { id: libroId, entity_type: "libro", display_name: data.titulo },
      });
    }

    return { success: true, message: "Libro creado exitosamente." };
  } catch (err) {
    console.error("[libroService] Error en la creación de dependencias, haciendo rollback:", err);
    await rollbackLibro(libroId);
    return {
      success: false,
      message: "Ocurrió un error al registrar las dependencias del libro. Se ha cancelado la operación.",
    };
  }
}

/**
 * Orquesta la creación de un libro con inventario inicial.
 */
export async function createBookWithInventory(
  data: InsertLibroPayload,
  id_tienda: string,
  cantidad: number
): Promise<LibroActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const isDuplicate = await checkLibroDuplicateInfo(
      data.titulo,
      data.isbn,
      data.estado
    );
    if (isDuplicate) {
      return {
        success: false,
        errors: { form: "Ya existe un libro con este título, ISBN y estado." },
        message: "El libro ya está registrado.",
      };
    }
  } catch (_) {
    return {
      success: false,
      message: "Error al verificar la existencia del libro.",
    };
  }

  const resultLibro = await createLibro(data);
  if (!resultLibro.success || !resultLibro.id) {
    return {
      success: false,
      message: resultLibro.error || "Error al crear el libro principal.",
    };
  }

  const libroId = String(resultLibro.id);

  try {
    // 1. Insertar copias
    const copiasResult = await createCopias({
      id_libro: libroId,
      estado: "disponible",
      cantidad: cantidad,
      id_tienda: id_tienda,
    });
    if (!copiasResult.success) throw new Error(copiasResult.message || "Error insertando copias");

    // 2. Fechas para noticia e histórico
    const now = new Date();
    const expiracion = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const noticiaResult = await insertNoticia({
      id_libro: libroId,
      fecha_publicacion: now.toISOString(),
      fecha_expiracion: expiracion.toISOString(),
      es_visible: true,
    });
    if (!noticiaResult.success) throw new Error(noticiaResult.error);

    const actor = await getCurrentUser();
    if (actor) {
      await logAdminAction({
        actorId: actor.id,
        action: AccionAdministrador.CREAR,
        description: `Se creó el libro "${data.titulo}" con ${cantidad} copias de inventario.`,
        entity: { id: libroId, entity_type: "libro", display_name: data.titulo },
      });
    }

    return { success: true, message: "Libro con inventario creado exitosamente." };
  } catch (err) {
    console.error("[libroService] Error en la creación de dependencias, haciendo rollback:", err);
    await rollbackLibro(libroId);
    return {
      success: false,
      message: "Ocurrió un error al registrar las dependencias o el inventario del libro. Se ha cancelado la operación.",
    };
  }
}

/**
 * Orquesta la edición de la información bibliográfica de un libro.
 */
export async function editBook(
  id: string,
  data: UpdateLibroPayload
): Promise<LibroActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const existingBook = await getActiveLibroById(id);
    if (!existingBook) {
      return { success: false, message: "El libro no existe o fue eliminado." };
    }

    const tituloToCheck = data.titulo ?? existingBook.titulo;
    const isbnToCheck = data.isbn ?? existingBook.isbn;
    const estadoToCheck = data.estado ?? existingBook.estado;

    const isDuplicate = await checkLibroDuplicateInfo(
      tituloToCheck,
      isbnToCheck,
      estadoToCheck,
      id
    );
    if (isDuplicate) {
      return {
        success: false,
        errors: { form: "Ya existe otro libro con este título, ISBN y estado." },
        message: "El libro ya está registrado.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error al verificar la existencia del libro.",
    };
  }

  const result = await updateLibroById(id, data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Error al actualizar el libro.",
    };
  }

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.MODIFICAR,
      description: `Se actualizó el libro ID ${id}.`,
      entity: { id: id, entity_type: "libro", display_name: data.titulo || "Desconocido" },
    });
  }

  return { success: true, message: "Libro actualizado exitosamente." };
}

/**
 * Orquesta el borrado lógico de un libro, verificando primero que no tenga copias asociadas.
 */
export async function removeBook(
  id: string,
  titulo: string,
  _estado: string
): Promise<LibroActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const copiasCount = await countCopiasByLibro(id);
    if (copiasCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el libro porque tiene ${copiasCount} copia(s) asociada(s).`,
      };
    }
  } catch (_) {
    return {
      success: false,
      message: "Error al verificar las copias asociadas al libro.",
    };
  }

  const result = await softDeleteLibroById(id);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Error al eliminar el libro.",
    };
  }

  // Borrado en cascada orquestado por el servicio
  await softDeleteNoticiaByLibroId(id);
  await deleteHistoricoByLibroId(id);

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.ELIMINAR,
      description: `Se eliminó (borrado lógico) el libro "${titulo}".`,
      entity: { id: id, entity_type: "libro", display_name: titulo },
    });
  }

  return { success: true, message: "Libro eliminado exitosamente." };
}

// ─── Lectura ───────────────────────────────────────────────────────

function buildHistoricoTimelineData(
  libroId: string,
  events: Awaited<ReturnType<typeof listHistoricoByLibro>>,
): HistoricoTimelineData | null {
  if (events.length === 0) return null;

  const now = new Date();
  const start = new Date(events[0].fecha);
  const timelineEnd = now > start ? now : start;

  const segments: HistoricoTimelineData["segments"] = [];
  for (let index = 0; index < events.length; index += 1) {
    const current = events[index];
    const next = events[index + 1];

    const segmentStart = new Date(current.fecha);
    const segmentEnd = next ? new Date(next.fecha) : timelineEnd;

    if (segmentEnd < segmentStart) continue;

    const lastSegment = segments[segments.length - 1];
    if (
      lastSegment &&
      lastSegment.estado === current.estado &&
      new Date(lastSegment.end_at) >= segmentStart
    ) {
      const mergedEndAt = segmentEnd.toISOString();
      lastSegment.end_at = mergedEndAt;
      lastSegment.duration_ms =
        new Date(mergedEndAt).getTime() - new Date(lastSegment.start_at).getTime();
      continue;
    }

    segments.push({
      estado: current.estado,
      start_at: segmentStart.toISOString(),
      end_at: segmentEnd.toISOString(),
      duration_ms: segmentEnd.getTime() - segmentStart.getTime(),
    });
  }

  return {
    id_libro: libroId,
    timeline_start_at: start.toISOString(),
    timeline_end_at: timelineEnd.toISOString(),
    segments,
  };
}

export async function fetchBookHistoricoTimeline(
  libroId: string,
): Promise<HistoricoTimelineResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const [book, historicoEvents] = await Promise.all([
      getActiveLibroById(libroId),
      listHistoricoByLibro(libroId),
    ]);

    if (!book) {
      return {
        success: false,
        errors: { libro_id: "El libro no existe o fue eliminado." },
      };
    }

    const timeline = buildHistoricoTimelineData(libroId, historicoEvents);
    if (!timeline) {
      return {
        success: false,
        message: "El libro no tiene registros históricos para mostrar.",
      };
    }

    return {
      success: true,
      data: timeline,
    };
  } catch (error: unknown) {
    console.error("[libroService] Error obteniendo timeline histórico:", error);
    return {
      success: false,
      message: "No se pudo cargar el histórico del libro.",
    };
  }
}

/**
 * Carga de manera paginada los libros, incluyendo la cantidad de copias.
 */
export async function fetchBooks(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<LibrosListResponse> {
  try {
    // Si la visualización del panel también requiere admin (opcional pero lo incluyo por consistencia):
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return {
      success: false,
      message: roleCheck.message || "No autorizado.",
    };

    const data = await getLibrosWithCopies(page, pageSize, searchTerm);

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error al obtener libros:", error);
    return {
      success: false,
      message: "No se pudieron cargar los libros.",
    };
  }
}
