"use server";

import {
  createAuthor,
  editAuthor,
  removeAuthor,
  fetchAuthors,
} from "@/services/authors/authorService";
import { sanitizeText } from "@/lib/validations/rules";
import { validateAuthor } from "@/lib/validations/author";
import type {
  AuthorsListResponse,
  AuthorActionResponse,
} from "@/lib/types/author";

// ─── Mutaciones ────────────────────────────────────────────────────

/**
 * Server Action: crea un nuevo autor.
 */
export async function crearAutor(
  nombre: string,
  nacionalidad: string,
  fechaNacimiento: string
): Promise<AuthorActionResponse> {
  const cleanNombre = sanitizeText(nombre);
  const cleanNacionalidad = nacionalidad.trim() || null;
  const cleanFecha = fechaNacimiento.trim() || null;

  const errors = validateAuthor({
    nombre: cleanNombre,
    nacionalidad: cleanNacionalidad,
    fecha_nacimiento: cleanFecha,
  });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return await createAuthor({
    nombre: cleanNombre,
    nacionalidad: cleanNacionalidad,
    fecha_nacimiento: cleanFecha,
  });
}

/**
 * Server Action: actualiza un autor existente.
 */
export async function actualizarAutor(
  id: number,
  nombre: string,
  nacionalidad: string,
  fechaNacimiento: string
): Promise<AuthorActionResponse> {
  if (!id || id <= 0) {
    return { success: false, message: "ID de autor no válido." };
  }

  const cleanNombre = sanitizeText(nombre);
  const cleanNacionalidad = nacionalidad.trim() || null;
  const cleanFecha = fechaNacimiento.trim() || null;

  const errors = validateAuthor({
    nombre: cleanNombre,
    nacionalidad: cleanNacionalidad,
    fecha_nacimiento: cleanFecha,
  });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return await editAuthor(id, {
    nombre: cleanNombre,
    nacionalidad: cleanNacionalidad,
    fecha_nacimiento: cleanFecha,
  });
}

/**
 * Server Action: elimina un autor (borrado lógico).
 */
export async function eliminarAutor(id: number, nombre: string): Promise<AuthorActionResponse> {
  if (!id || id <= 0) {
    return { success: false, message: "ID de autor no válido." };
  }

  return await removeAuthor(id, nombre);
}

// ─── Lectura ───────────────────────────────────────────────────────

/**
 * Server Action: obtiene la lista de autores con conteo de libros (paginada).
 */
export async function obtenerAutores(
  page: number = 1,
  pageSize: number = 10,
  searchTerm?: string
): Promise<AuthorsListResponse> {
  return await fetchAuthors(page, pageSize, searchTerm);
}
