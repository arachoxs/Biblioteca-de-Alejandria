export const ROLES = {
    ROOT: "ROOT",
    ADMINISTRADOR: "ADMINISTRADOR",
    CLIENTE: "CLIENTE",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
export const VISITANTE = "VISITANTE" as const;

export function getRoleFromJwtClaims(claims: any): AppRole | typeof VISITANTE {
    const role = claims?.app_metadata?.role;
    if (role === ROLES.ROOT || role === ROLES.ADMINISTRADOR || role === ROLES.CLIENTE) {
        return role;
    }
    return VISITANTE;
}