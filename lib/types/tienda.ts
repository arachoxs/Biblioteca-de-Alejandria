import type { Database } from "@/lib/types/supabase";
import type { ActionResponse, PaginatedResponse } from "./common";

// ─── Constantes reutilizables ────────────────────────────────────────

export const TIENDA_DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type TiendaDia = (typeof TIENDA_DIAS)[number];

export const TIENDA_DIA_LABELS: Record<TiendaDia, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

// ─── Fila base desde Supabase ──────────────────────────────────────

/** Fila completa de la tabla `tienda` (lectura). */
export type TiendaRow = Database["public"]["Tables"]["tienda"]["Row"];

// ─── Payloads de entrada (escritura) ───────────────────────────────

/** Payload para crear una nueva tienda. */
export interface InsertTiendaPayload {
  nombre: string;
  horario: TiendaHorario;
  id_direccion: number;
}

export type TiendaGlobal = {
  id: string;
  nombre: string;
};

/** Payload para actualizar una tienda existente. */
export interface UpdateTiendaPayload {
  nombre?: string;
  horario?: TiendaHorario;
  id_direccion?: number;
}

/** Datos de dirección capturados desde Google Autocomplete. */
export interface TiendaAddressPayload {
  direccion: string;
  direccion_place_id: string;
}

/** Payload de creación desde la vista (sin exponer id_direccion). */
export type CreateTiendaInput = Omit<InsertTiendaPayload, "id_direccion"> &
  TiendaAddressPayload;

/** Payload de edición desde la vista. */
export type UpdateTiendaInput = Omit<UpdateTiendaPayload, "id_direccion"> &
  Partial<TiendaAddressPayload>;

export type NameComparison = {
  left: string;
  right: string;
};

export type AddressCreationInput = {
  direccion: string;
  placeId: string;
};

export type AddressCleanupInput = {
  addressId: number | null;
};

export type UpdateTiendaPrecheckParams = {
  input: UpdateTiendaInput;
  currentName: string;
  tiendaId: string;
  currentPlaceId?: string | null;
};

export type UpdateAddressDecisionParams = {
  input: UpdateTiendaInput;
  currentPlaceId?: string | null;
};

export type FetchTiendasParams = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
};

export type UpdateTiendaParams = {
  tiendaId: string;
  input: UpdateTiendaInput;
};

export type DeleteTiendaParams = {
  tiendaId: string;
};

export type AddressErrorOptions = {
  error?: string;
};

// ─── Tipos auxiliares ──────────────────────────────────────────────

/**
 * Estructura tipada del campo `horario` (almacenado como JSON en BD).
 * Cada día contiene un rango horario o `null` si la tienda no abre.
 */
export interface TiendaHorario {
  lunes: RangoHorario | null;
  martes: RangoHorario | null;
  miercoles: RangoHorario | null;
  jueves: RangoHorario | null;
  viernes: RangoHorario | null;
  sabado: RangoHorario | null;
  domingo: RangoHorario | null;
}

export interface RangoHorario {
  apertura: string;
  cierre: string;
}

// ─── Tipos con datos derivados ─────────────────────────────────────

/** Fila de tienda para lectura con `horario` fuertemente tipado. */
export type TiendaRead = Omit<TiendaRow, "horario"> & {
  horario: TiendaHorario;
};

/** Tienda con la dirección formateada (para listados). */
export interface TiendaWithDireccion extends TiendaRead {
  direccion_formateada: string;
  direccion_place_id: string;
}

// ─── Respuestas de Server Actions ──────────────────────────────────

/** Respuesta de listado de tiendas paginada. */
export type TiendasListResponse = PaginatedResponse<TiendaWithDireccion>;

/** Respuesta de mutación de tienda (crear/editar/eliminar). */
export type TiendaActionResponse = ActionResponse;
