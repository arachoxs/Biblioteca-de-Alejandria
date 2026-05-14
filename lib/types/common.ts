/**
 * Tipos base genéricos reutilizables para el proyecto.
 * Centraliza patrones comunes para evitar duplicación (DRY).
 */

// ─── Respuestas de API / Server Actions ────────────────────────────

/**
 * Respuesta base para Server Actions, frontend y servicios.
 * Patrón: success + errores por campo + mensaje opcional.
 */
export interface ActionResponse {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

/**
 * Respuesta genérica con datos tipados.
 * Usar cuando se necesita retornar datos además del estado.
 */
export interface DataResponse<T> extends ActionResponse {
  data?: T;
}

export interface DataResponseArray<T> extends ActionResponse {
  data?: T[];
}

// ─── Paginación ────────────────────────────────────────────────────

/**
 * Metadatos estándar de paginación.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Wrapper para datos paginados de cualquier tipo.
 */
export interface Paginated<T> extends PaginationMeta {
  data: T[];
}

/**
 * Respuesta paginada genérica (combina DataResponse + Paginated).
 */
export type PaginatedResponse<T> = DataResponse<Paginated<T>>;
