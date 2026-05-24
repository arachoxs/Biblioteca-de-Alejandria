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