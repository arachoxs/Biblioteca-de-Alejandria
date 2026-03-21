import type { AuthResponse } from "@supabase/supabase-js";

export enum Genero {
    Masculino = "masculino",
    Femenino = "femenino",
    Otro = "otro",
}

export enum Rol {
    CLIENTE = "CLIENTE",
    ADMINISTRADOR = "ADMINISTRADOR",
    ROOT = "ROOT"
}

export interface CredentialData {
    correo: string;
    contrasena: string;
    confirmar_contrasena: string;
}

export interface PersonalData {
    dni: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    genero: Genero;
    direccion: string;
    direccion_place_id: string;
    direccion_detalle?: string;
    usuario: string;
}

export interface AuthSignUpResult {
    success: boolean;
    errors?: Record<string, string>;
    message?: string;
    data?: AuthResponse["data"];
}

export interface MailSentResponse {
    success: boolean;
    message: string;
}

export interface RegisterResponse { //respuesta que se envia al frontend
    success: boolean;
    errors?: Record<string, string>;
    message?: string | null;
}

export interface AuthActionResult {
    error?: string;
    success?: boolean;
    message?: string;
}

export interface LoginState {
    error?: string;
    success?: boolean;
}
