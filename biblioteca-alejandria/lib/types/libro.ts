import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `libro` (lectura). */
export type LibroRow = Database["public"]["Tables"]["libro"]["Row"];

// ─── Enums ─────────────────────────────────────────────────────────

/** Condición del libro: "nuevo" | "usado". */
export type CondicionLibro = Database["public"]["Enums"]["condicion_libro"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear un nuevo libro. */
export interface InsertLibroPayload {
  titulo: string;
  isbn: string;
  idioma: string;
  /**
   * Resumen o descripción breve del libro.
   * NOTA: Este campo se expone como `sinopsis` en el nivel de aplicación,
   * pero internamente debe mapearse a la columna `sipnosis` al persistir
   * en la base de datos debido a un typo heredado en el esquema.
   */
  sinopsis: string;
  paginas: number;
  precio: number;
  ano_publicacion: string;
  estado: CondicionLibro;
  id_autor: number;
  id_categoria: number;
  fecha_publicacion?: string | null;
  editorial?: string | null;
  id_modeloRA?: number | null;
}

/** Payload para actualizar un libro existente. */
export interface UpdateLibroPayload {
  titulo?: string;
  isbn?: string;
  idioma?: string;
  /**
   * Resumen o descripción breve del libro.
   * NOTA: Este campo se expone como `sinopsis` en el nivel de aplicación,
   * pero internamente debe mapearse a la columna `sipnosis` al persistir
   * en la base de datos debido a un typo heredado en el esquema.
   */
  sinopsis?: string;
  paginas?: number;
  precio?: number;
  ano_publicacion?: string;
  estado?: CondicionLibro;
  id_autor?: number;
  id_categoria?: number;
  fecha_publicacion?: string | null;
  editorial?: string | null;
  id_modeloRA?: number | null;
}

// ─── Tipos con datos derivados ─────────────────────────────────────

export interface LibroWithRelations extends LibroRow {
  autor_nombre: string | null;
  categoria_nombre: string | null;
  copias_count?: number;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de libros paginada. */
export type LibrosListResponse = PaginatedResponse<LibroWithRelations>;

/** Respuesta de mutación de libro (crear/editar/eliminar). */
export type LibroActionResponse = ActionResponse;
