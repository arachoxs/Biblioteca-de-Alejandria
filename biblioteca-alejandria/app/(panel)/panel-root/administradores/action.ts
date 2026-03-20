"use server";

import { registerAuthUser } from "@/services/auth/registrationService";
import { CredentialData,Rol,RegisterResponse,AuthSignUpResult } from "@/lib/types/auth";


function generateRandomPassword(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    // Usamos el web crypto global para evitar problemas de compatibilidad
    const array = new Uint8Array(length);
    crypto.getRandomValues(array); 
    
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(array[i] % chars.length);
    }
    return password;
}


export async function createAdmin(email: string): Promise<RegisterResponse> {
    console.log("entro");
    const password = generateRandomPassword(12);

    const credentialData: CredentialData = {
        correo: email,
        contrasena: password,
        confirmar_contrasena: password
    };

    const authResponse: AuthSignUpResult = await registerAuthUser(credentialData, Rol.ADMINISTRADOR);

    if (!authResponse.success) {
        return {
            success: false,
            errors: authResponse.errors,
            message: authResponse.message,
        };
    }

    return {
        success: true,
        message: `Administrador creado exitosamente.`,
    };
}