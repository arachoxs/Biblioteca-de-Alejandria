import type { TiendaHorario, TiendaWithDireccion } from "@/lib/types/tienda";

export interface TiendaFormValues extends Record<string, unknown> {
  nombre: string;
  direccion: string;
  direccion_place_id: string;
  horario: TiendaHorario;
}

export interface TiendaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tienda?: TiendaWithDireccion | null;
}

export type TiendaFormErrors = Record<string, string>;
