import { matchRule, passwordRule, requiredPasswordRule, requiredRule, validateFieldRules } from "./rules";

/**
 * Verifica si una contraseña cumple todos los requisitos de validación.
 * Útil para bloquear submit sin generar mensajes de error.
 * @param password - La contraseña a validar
 * @returns true si la contraseña es válida, false en caso contrario
 */
export function isPasswordValid(password: string): boolean {
    if (!password) return false;
    const error = validateFieldRules(password, [requiredPasswordRule(), passwordRule()]);
    return error === null;
}

/**
 * Valida una contraseña y su confirmación.
 * @param contrasena - La contraseña principal
 * @param confirmar_contrasena - La confirmación de la contraseña
 * @param useIndicator - Si es true, NO genera errores para el campo principal (se usa el PasswordStrengthIndicator visual)
 * @returns Record con errores encontrados o null si no hay errores
 */
export function validatePasswords(
    contrasena: string, 
    confirmar_contrasena: string,
    useIndicator: boolean = false
): Record<string, string> | null {
    const errors: Record<string, string> = {};

    // Validar contraseña principal (solo si NO estamos usando el indicador visual)
    if (!useIndicator) {
        const contrasenaError = validateFieldRules(contrasena, [requiredPasswordRule(), passwordRule()]);
        if (contrasenaError) errors.contrasena = contrasenaError;
    }

    // Validar confirmación de contraseña (siempre se valida)
    const confirmarError = validateFieldRules(confirmar_contrasena, [
        requiredRule("Confirmar contraseña"),
        matchRule(() => contrasena, "Las contraseñas no coinciden."),
    ]);
    if (confirmarError) errors.confirmar_contrasena = confirmarError;

    return Object.keys(errors).length > 0 ? errors : null;
}
