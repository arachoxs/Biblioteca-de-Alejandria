import type { DataResponse, PaginatedResponse } from "./common";
import type { Database } from "./supabase";

export type VistaInventarioRow =
  Database["public"]["Views"]["vista_inventario"]["Row"];

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
  id_copia_seq: string;
  tienda_id: string;
  nombre_tienda: string;
  estado_copia: Database["public"]["Enums"]["estado_copia"];
}

export interface InventarioOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface InventarioTransferBookOption extends InventarioOption {
  max_copias_disponibles: number;
}

export type InventarioListResponse = PaginatedResponse<InventarioLibroItem>;
export type InventarioCopiasResponse =
  PaginatedResponse<InventarioCopiaDetalle>;
export type InventarioOptionsResponse = DataResponse<InventarioOption[]>;
export type InventarioOptionResponse = DataResponse<InventarioOption>;
export type InventarioTransferBooksResponse = DataResponse<
  InventarioTransferBookOption[]
>;
