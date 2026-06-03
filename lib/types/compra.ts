import type { Database } from "@/lib/types/supabase";
import type { Paginated } from "./common";

export type CompraRow = Database["public"]["Tables"]["compra"]["Row"];

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CompraCreateInput {
  fecha: string;
  id_usuario: string;
  subtotal: number;
  total: number;
  id_promocion?: number | null;
}

export interface CompraFilters {
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CompraListParams extends PaginationParams {
  filters?: CompraFilters;
}

export type CompraListResponse = Paginated<CompraRow>;

// ─── Tipos enriquecidos para historial ─────────────────────────────

/** Libro dentro de un item de compra. */
export interface CompraItemLibro {
  id: string;
  titulo: string;
  precio: number;
  editorial: string;
  idioma: string;
}

/** Item de compra agrupado por libro. */
export interface CompraItem {
  libro: CompraItemLibro | null;
  cantidad: number;
  imagen_portada: string | null;
  precio_unitario: number;
}

/** Compra completa con sus items para el historial. */
export interface CompraConItems {
  id: string;
  fecha: string;
  subtotal: number;
  total: number;
  id_promocion: number | null;
  items: CompraItem[];
}

/** Response paginado de compras con items. */
export type CompraHistorialResponse = Paginated<CompraConItems>;

// ─── Tipos para detalle de compra ──────────────────────────────────

/** Tarjeta usada en una compra (info segura para el cliente). */
export interface CompraTarjetaInfo {
  monto: number;
  ultimos_cuatro_digitos: string;
  nombre_titular: string | null;
}

/** Información de entrega de una compra. */
export interface CompraEntregaInfo {
  tipo: string;
  estado: string;
  costo: number;
  fecha_entrega_estimada: string;
  fecha_entregado: string | null;
  direccion: string;
}

/** Datos extra de una compra: tarjetas y entrega. */
export interface CompraDetalleExtra {
  tarjetas: CompraTarjetaInfo[];
  entrega: CompraEntregaInfo | null;
}