import {
  insertAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthors,
  checkAuthorExists,
  getAuthorBookCount,
} from "@/models/authorModel";
import { getCurrentUser } from "@/models/authModel";
import { logAdminAction } from "@/services/admin/auditService";
import { AccionAdministrador } from "@/lib/types/audit";
import { requireAdminRole } from "@/lib/validations/server-auth";
import type {
  AuthorsListResponse,
  AuthorActionResponse,
  InsertAuthorPayload,
  UpdateAuthorPayload,
} from "@/lib/types/author";

// ─── Escritura ─────────────────────────────────────────────────────

/**
 * Orquesta la creación de un autor:
 * 1. Verifica permisos (ADMINISTRADOR).
 * 2. Comprueba que no exista un duplicado (mismo nombre + nacionalidad).
 * 3. Delega la inserción al modelo.
 * 4. Registra la acción en auditoría.
 */
export async function createAuthor(
  data: InsertAuthorPayload
): Promise<AuthorActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const exists = await checkAuthorExists(data.nombre, data.nacionalidad);
    if (exists) {
      return {
        success: false,
        errors: { nombre: "Ya existe un autor con este nombre y nacionalidad." },
        message: "El autor ya está registrado.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Error al verificar la existencia del autor.",
    };
  }

  const result = await insertAuthor(data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Error al crear el autor.",
    };
  }

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.CREAR,
      description: `Se creó el autor "${data.nombre}" (${data.nacionalidad}).`,
      entity: { nombre: data.nombre, nacionalidad: data.nacionalidad },
    });
  }

  return { success: true, message: "Autor creado exitosamente." };
}

/**
 * Orquesta la edición de un autor:
 * 1. Verifica permisos.
 * 2. Comprueba duplicado excluyendo el propio registro.
 * 3. Delega la actualización al modelo.
 * 4. Registra la acción en auditoría.
 */
export async function editAuthor(
  id: number,
  data: UpdateAuthorPayload
): Promise<AuthorActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  try {
    const exists = await checkAuthorExists(data.nombre, data.nacionalidad, id);
    if (exists) {
      return {
        success: false,
        errors: { nombre: "Ya existe otro autor con este nombre y nacionalidad." },
        message: "El autor ya está registrado.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Error al verificar la existencia del autor.",
    };
  }

  const result = await updateAuthor(id, data);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Error al actualizar el autor.",
    };
  }

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.MODIFICAR,
      description: `Se actualizó el autor ID ${id}: "${data.nombre}".`,
      entity: { id, nombre: data.nombre, nacionalidad: data.nacionalidad },
    });
  }

  return { success: true, message: "Autor actualizado exitosamente." };
}

/**
 * Orquesta el borrado lógico de un autor:
 * 1. Verifica permisos.
 * 2. Bloquea el borrado si el autor tiene libros activos asociados.
 * 3. Delega al modelo (soft-delete via `deleted_at`).
 * 4. Registra en auditoría.
 */
export async function removeAuthor(
  id: number
): Promise<AuthorActionResponse> {
  const roleCheck = await requireAdminRole();
  if (!roleCheck.success) return roleCheck;

  // Verificar dependencias: no se puede borrar un autor con libros activos
  try {
    const bookCount = await getAuthorBookCount(id);
    if (bookCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el autor porque tiene ${bookCount} libro${bookCount === 1 ? "" : "s"} activo${bookCount === 1 ? "" : "s"} asociado${bookCount === 1 ? "" : "s"}.`,
      };
    }
  } catch {
    return {
      success: false,
      message: "Error al verificar los libros asociados al autor.",
    };
  }

  const result = await deleteAuthor(id);

  if (!result.success) {
    return {
      success: false,
      message: result.error || "Error al eliminar el autor.",
    };
  }

  const actor = await getCurrentUser();
  if (actor) {
    await logAdminAction({
      actorId: actor.id,
      action: AccionAdministrador.ELIMINAR,
      description: `Se eliminó (borrado lógico) el autor ID ${id}.`,
      entity: { id },
    });
  }

  return { success: true, message: "Autor eliminado exitosamente." };
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Obtiene la lista de autores activos con conteo de libros, paginada.
 */
export async function fetchAuthors(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<AuthorsListResponse> {
  try {
    const roleCheck = await requireAdminRole();
    if (!roleCheck.success) return roleCheck;

    const data = await getAuthors(page, pageSize, searchTerm);

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error al obtener autores:", error);
    return {
      success: false,
      message: "No se pudieron cargar los autores.",
    };
  }
}
