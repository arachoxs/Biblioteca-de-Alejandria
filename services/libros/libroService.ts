import { getErrorMessage } from "@/lib/services/errors";
import { requireAdminRole } from "@/lib/validations/server-auth";
import {
  checkLibroDuplicateInfo,
  createLibro,
  getLibros,
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
import { createDefaultModeloRA } from "@/models/modeloRAModel";
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

async function validateAndCheckDuplicate(
  data: InsertLibroPayload,
  excludeId?: string,
): Promise<{ ok: true } | { ok: false; response: LibroActionResponse }> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return { ok: false, response: roleCheck };

  let isDuplicate: boolean;
  try {
    isDuplicate = await checkLibroDuplicateInfo(
      data.titulo,
      data.isbn,
      data.estado,
      excludeId,
    );
  } catch (error) {
    return {
      ok: false,
      response: {
        success: false,
        message: `Error al verificar la existencia del libro: ${getErrorMessage(error)}`,
      },
    };
  }

  if (isDuplicate) {
    return {
      ok: false,
      response: {
        success: false,
        errors: { form: excludeId
          ? "Ya existe otro libro con este título, ISBN y estado."
          : "Ya existe un libro con este título, ISBN y estado." },
        message: "El libro ya está registrado.",
      },
    };
  }

  return { ok: true };
}

async function logBookAudit(
  libroId: string,
  titulo: string,
  action: AccionAdministrador,
  description: string,
): Promise<void> {
  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action,
      description,
      entity: { id: libroId, entity_type: "libro", display_name: titulo },
    });
  }
}

async function insertBookSideEffects(libroId: string): Promise<void> {
  const now = new Date();
  const expiracion = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  await insertNoticia({
    id_libro: libroId,
    fecha_publicacion: now.toISOString(),
    fecha_expiracion: expiracion.toISOString(),
    es_visible: true,
  });

  await insertHistorico({
    id_libro: libroId,
    estado: "agotado",
    fecha: now.toISOString(),
  });
}
// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Orquesta la creación de un libro sin inventario.
 * Crea automáticamente un modelo RA con dimensiones por defecto.
 */
export async function createBook(
  data: InsertLibroPayload
): Promise<LibroActionResponse> {
  const validation = await validateAndCheckDuplicate(data);
  if (!validation.ok) return validation.response;

  let libroId: string;
  try {
    const modeloRAId = await createDefaultModeloRA(data.paginas);
    data.id_modeloRA = modeloRAId;
    libroId = await createLibro(data);
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }

  try {
    await insertBookSideEffects(libroId);
    await logBookAudit(
      libroId,
      data.titulo,
      AccionAdministrador.CREAR,
      `Se creó el libro "${data.titulo}" (sin inventario).`,
    );
    return { success: true, message: "Libro creado exitosamente." };
  } catch (err) {
    console.error("[libroService] Error en la creación de dependencias, haciendo rollback:", err);
    await rollbackLibro(libroId);
    return {
      success: false,
      message: `Ocurrió un error al registrar las dependencias del libro: ${getErrorMessage(err)}. Se ha cancelado la operación.`,
    };
  }
}

export async function createBookWithInventory(
  data: InsertLibroPayload,
  id_tienda: string,
  cantidad: number
): Promise<LibroActionResponse> {
  const validation = await validateAndCheckDuplicate(data);
  if (!validation.ok) return validation.response;

  let libroId: string;
  try {
    const modeloRAId = await createDefaultModeloRA(data.paginas);
    data.id_modeloRA = modeloRAId;
    libroId = await createLibro(data);
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }

  try {
    const copiasResult = await createCopias({
      id_libro: libroId,
      estado: "disponible",
      cantidad: cantidad,
      id_tienda: id_tienda,
    });
    if (!copiasResult.success) throw new Error(copiasResult.message || "Error insertando copias");

    await insertBookSideEffects(libroId);
    await logBookAudit(
      libroId,
      data.titulo,
      AccionAdministrador.CREAR,
      `Se creó el libro "${data.titulo}" con ${cantidad} copias de inventario.`,
    );
    return { success: true, message: "Libro con inventario creado exitosamente." };
  } catch (err) {
    console.error("[libroService] Error en la creación de dependencias, haciendo rollback:", err);
    await rollbackLibro(libroId);
    return {
      success: false,
      message: `Ocurrió un error al registrar las dependencias o el inventario del libro: ${getErrorMessage(err)}. Se ha cancelado la operación.`,
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
  try {
    const existingBook = await getActiveLibroById(id);
    if (!existingBook) {
      return { success: false, message: "El libro no existe o fue eliminado." };
    }

    const tituloToCheck = data.titulo ?? existingBook.titulo;
    const isbnToCheck = data.isbn ?? existingBook.isbn;
    const estadoToCheck = data.estado ?? existingBook.estado;

    const validation = await validateAndCheckDuplicate(
      { ...data, titulo: tituloToCheck, isbn: isbnToCheck, estado: estadoToCheck, idioma: "", sinopsis: "", paginas: 0, precio: 0, id_autor: 0, id_categoria: 0, fecha_publicacion: "", editorial: "" } as InsertLibroPayload,
      id,
    );
    if (!validation.ok) return validation.response;
  } catch (error) {
    return {
      success: false,
      message: `Error al verificar la existencia del libro: ${getErrorMessage(error)}`,
    };
  }

  try {
    await updateLibroById(id, data);
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }

  await logBookAudit(
    id,
    data.titulo || "Desconocido",
    AccionAdministrador.MODIFICAR,
    `Se actualizó el libro ID ${id}.`,
  );

  return { success: true, message: "Libro actualizado exitosamente." };
}

/**
 * Orquesta el borrado lógico de un libro, verificando primero que no tenga copias asociadas.
 */
export async function removeBook(
  id: string,
  titulo: string
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
  } catch {
    return {
      success: false,
      message: "Error al verificar las copias asociadas al libro.",
    };
  }

  try {
    await softDeleteLibroById(id);
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }

  await softDeleteNoticiaByLibroId(id);
  await deleteHistoricoByLibroId(id);
  await logBookAudit(
    id,
    titulo,
    AccionAdministrador.ELIMINAR,
    `Se eliminó (borrado lógico) el libro "${titulo}".`,
  );

  return { success: true, message: "Libro eliminado exitosamente." };
}

// ─── Lectura ───────────────────────────────────────────────────────

function tryMergeSegment(
  segments: HistoricoTimelineData["segments"],
  estado: string,
  segmentStart: Date,
  segmentEnd: Date,
): boolean {
  const lastSegment = segments[segments.length - 1];
  if (
    lastSegment &&
    lastSegment.estado === estado &&
    new Date(lastSegment.end_at) >= segmentStart
  ) {
    const mergedEndAt = segmentEnd.toISOString();
    lastSegment.end_at = mergedEndAt;
    lastSegment.duration_ms =
      new Date(mergedEndAt).getTime() - new Date(lastSegment.start_at).getTime();
    return true;
  }
  return false;
}

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

    if (!tryMergeSegment(segments, current.estado, segmentStart, segmentEnd)) {
      segments.push({
        estado: current.estado,
        start_at: segmentStart.toISOString(),
        end_at: segmentEnd.toISOString(),
        duration_ms: segmentEnd.getTime() - segmentStart.getTime(),
      });
    }
  }

  return {
    id_libro: libroId,
    timeline_start_at: start.toISOString(),
    timeline_end_at: timelineEnd.toISOString(),
    segments,
    logs: events.map((event) => ({
      id: event.id,
      estado: event.estado,
      fecha: event.fecha,
    })),
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

    const data = await getLibros(page, pageSize, searchTerm, true);

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error al obtener libros:", error);
    return {
      success: false,
      message: "No se pudieron cargar los libros.",
    };
  }
}
