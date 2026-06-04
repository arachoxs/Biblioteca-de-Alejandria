import type { Database } from "@/lib/types/supabase";

export type ItemCompraRow = Database["public"]["Tables"]["item_compra"]["Row"];

export interface ItemCompraCreateInput {
  id_compra: string;
  id_copia: string;
  monto: number;
}