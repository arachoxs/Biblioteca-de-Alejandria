import type { DataResponse, PaginatedResponse } from "./common";
import type { Database } from "./supabase";

export type VistaInventarioRow = Database["public"]["Views"]["vista_inventario"]["Row"];

export interface InventarioLibroItem {
  libro_id: string;
  isbn_libro: string;
  nombre_libro: string;
  autor_libro: string;
  estado_libro: Database["public"]["Enums"]["condicion_libro"];
  cantidad_disponible: number;
  cantidad_total: number;
}

export interface InventarioCopiaDetalle {
  id_copia: string;
  tienda_id: string;
  nombre_tienda: string;
  estado_copia: Database["public"]["Enums"]["estado_copia"];
}

export interface InventarioOption {
  value: string;
  label: string;
  subtitle?: string;
}

export type InventarioListResponse = PaginatedResponse<InventarioLibroItem>;
export type InventarioCopiasResponse = DataResponse<InventarioCopiaDetalle[]>;
export type InventarioOptionsResponse = DataResponse<InventarioOption[]>;
