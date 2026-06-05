export interface PromocionRow {
  id: number;
  nombre: string;
  porcentaje_descuento: number;
  tipo: string;
  id_usuario: string;
  fecha_expiracion: string;
  usada: boolean;
  deleted_at: string | null;
}

export type PromocionInsert = Omit<PromocionRow, "id" | "deleted_at" | "usada"> & {
  usada?: boolean;
};

export interface PromocionActiva {
  id: number;
  porcentaje_descuento: number;
  nombre: string;
}
