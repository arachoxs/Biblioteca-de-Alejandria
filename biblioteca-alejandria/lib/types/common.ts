/**
 * Tipos base genéricos reutilizables para el proyecto.
 * Centraliza patrones comunes para evitar duplicación (DRY).
 */

// ─── Resultados de operaciones ─────────────────────────────────────

/**
 * Resultado base para operaciones que pueden fallar.
 * Usado en modelos y operaciones internas.
 */
export interface ModelResult {
  success: boolean;
  error?: string;
}

/**
 * Resultado de operación con ID generado (ej: INSERT con RETURNING id).
 */
export interface ModelResultWithId extends ModelResult {
  id?: number;
}

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
