import type { Database } from "@/lib/types/supabase";

export type EntregaRow = Database["public"]["Tables"]["entrega"]["Row"];

export interface EntregaCreateInput {
  id_compra: string;
  tipo: Database["public"]["Enums"]["tipo_entrega"];
  costo: number;
  fecha_entrega_estimada: string;
  id_direccion_destino: number;
  estado?: Database["public"]["Enums"]["estado_entrega"];
}
