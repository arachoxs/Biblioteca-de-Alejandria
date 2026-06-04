import type { Database } from "@/lib/types/supabase";

export type DevolucionRow = Database["public"]["Tables"]["devolucion"]["Row"];
export type ItemDevolucionRow =
  Database["public"]["Tables"]["item_devolucion"]["Row"];

export type EstadoDevolucion =
  Database["public"]["Enums"]["estado_devolucion"];
export type MotivoDevolucion =
  Database["public"]["Enums"]["motivo_devolucion"];

// ─── Input para crear devolución ──────────────────────────────────

export interface CrearDevolucionInput {
  id_usuario: string;
  items: {
    id_copia: string;
    motivo: MotivoDevolucion;
    descripcion_motivo?: string;
  }[];
}

// ─── Item individual del modal de solicitud ───────────────────────

export interface ItemDevolucionElegible {
  id_item_compra: number;
  id_copia: string;
  libro: { id: string; titulo: string; editorial: string } | null;
  imagen_portada: string | null;
  precio_unitario: number;
  ya_devuelto: boolean;
}

// ─── Respuesta del servicio al solicitar devolución ───────────────

export interface SolicitarDevolucionResponse {
  success: boolean;
  devolucionId?: number;
  errors?: Record<string, string>;
}

// ─── Item enriquecido dentro de una devolución ────────────────────

export interface DevolucionItemDetalle {
  id: number;
  id_copia: string;
  motivo: MotivoDevolucion;
  descripcion_motivo: string | null;
  libro: { titulo: string; editorial: string } | null;
  imagen_portada: string | null;
}

// ─── Devolución completa con items ────────────────────────────────

export interface DevolucionConItems {
  id: number;
  fecha: string;
  estado: EstadoDevolucion;
  token: string;
  items: DevolucionItemDetalle[];
}
