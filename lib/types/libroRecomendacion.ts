import type { DataResponse, PaginatedResponse } from "./common";
import type { Database } from "./supabase";

export type VistaLibroRecomendacionRow =
  Database["public"]["Views"]["vista_libros_recomendacion"]["Row"];

/**
 * Tipos no-nullable por diseño: la vista aplica INNER JOINs con
 * deleted_at IS NULL, así que los campos siempre deberían existir.
 * Si cambia el query, revisar estos tipos.
 */
export interface LibroRecomendacionItem {
  libro_id: string;
  titulo: string;
  isbn: string;
  idioma: string;
  sipnosis: string;
  paginas: number;
  precio: number;
  condicion_libro: Database["public"]["Enums"]["condicion_libro"];
  editorial: string;
  fecha_publicacion: string;
  ano_publicacion: number | null;
  autor_id: number;
  autor_nombre: string;
  autor_nacionalidad: string | null;
  categoria_id: number;
  categoria_nombre: string;
  categoria_descripcion: string | null;
  copias_disponibles: number;
  copias_reservadas: number;
  copias_vendidas: number;
  noticia_id: string | null;
}

export interface LibroRecomendacionBusqueda {
  termino?: string;
  categoria_id?: number;
  autor_id?: number;
  idioma?: string;
}

export type LibroRecomendacionResponse =
  PaginatedResponse<LibroRecomendacionItem>;

export type LibroRecomendacionSingleResponse =
  DataResponse<LibroRecomendacionItem>;
