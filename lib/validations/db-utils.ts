/** Escapa caracteres especiales de LIKE/ILIKE: \, %, _ */
export function escapeLikePattern(input: string): string {
    if (!input) return "";
    return input.trim().replace(/[\\%_]/g, "\\$&");
}

/** Escapa y envuelve con comodines para búsqueda parcial ILIKE.
 *  Convierte espacios internos a `%` para tolerar variaciones de espaciado.
 */
export function formatILIKE(input: string): string {
    const escaped = escapeLikePattern(input);
    const spaceFlexible = escaped.replace(/\s+/g, "%");
    return `%${spaceFlexible}%`;
}

/** Escapa valor para literal entre comillas en filtros lógicos de PostgREST. */
export function quotePostgrestFilterValue(input: string): string {
    const escaped = input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
}

/** Construye expresión OR segura para filtros ILIKE multi-columna en PostgREST. */
export function buildOrILikeFilter(columns: string[], input: string): string {
    const ilikePattern = quotePostgrestFilterValue(formatILIKE(input));
    return columns.map((column) => `${column}.ilike.${ilikePattern}`).join(",");
}
