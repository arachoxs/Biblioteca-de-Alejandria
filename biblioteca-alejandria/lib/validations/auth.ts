import { matchRule, passwordRule, requiredPasswordRule, requiredRule, validateFieldRules } from "./rules";


export function validatePasswords(contrasena: string, confirmar_contrasena: string): object | null {
    const errors: Record<string, string> = {};

// Validar contraseña
    const contrasenaError = validateFieldRules(contrasena, [requiredPasswordRule(), passwordRule()]);
    if (contrasenaError) errors.contrasena = contrasenaError;

    // Validar confirmación de contraseña
    const confirmarError = validateFieldRules(confirmar_contrasena, [
        requiredRule("Confirmar contraseña"),
        matchRule(() => contrasena, "Las contraseñas no coinciden."),
    ]);
    if (confirmarError) errors.confirmar_contrasena = confirmarError;

    return Object.keys(errors).length > 0 ? errors : null;
}
