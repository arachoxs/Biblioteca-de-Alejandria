/** Escapa caracteres especiales de LIKE/ILIKE: \, %, _ */
export function escapeLikePattern(input: string): string {
    if (!input) return "";
    return input.trim().replace(/[\\%_]/g, "\\$&");
}

/** Escapa y envuelve con comodines para búsqueda parcial ILIKE. */
export function formatILIKE(input: string): string {
    return `%${escapeLikePattern(input)}%`;
}