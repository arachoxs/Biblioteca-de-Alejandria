export function escapeLikePattern(input: string): string {
    if (!input) return "";
    // Escapamos \, % y _ anteponiendo una barra invertida
    return input.trim().replace(/[\\%_]/g, "\\$&");
}

/**
 * Opcional: Una función que además agrega los comodines para búsqueda parcial
 */
export function formatILIKE(input: string): string {
    return `%${escapeLikePattern(input)}%`;
}