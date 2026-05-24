import type { Database } from "@/lib/types/supabase";

/** Row type from DB */
export type TarjetaCompraRow = Database["public"]["Tables"]["tarjeta_compra"]["Row"];

/** Input for inserting a tarjeta_compra record */
export interface TarjetaCompraCreateInput {
  id_compra: string;
  id_tarjeta: number;
  monto: number;
}