import type { AuthResponse } from "@supabase/supabase-js";
import type { ActionResponse, DataResponse } from "./common";

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

/**
 * Resultado de signup en Supabase Auth.
 * Extiende DataResponse con los datos específicos de AuthResponse.
 */
export type AuthSignUpResult = DataResponse<AuthResponse["data"]>;

/**
 * Respuesta de envío de email.
 * Solo necesita success y message (sin errors por campo).
 */
export interface MailSentResponse {
    success: boolean;
    message: string;
}

/**
 * Respuesta genérica de registro (server action).
 * @alias ActionResponse - Semánticamente igual.
 */
export type RegisterResponse = ActionResponse;

/**
 * Resultado de acciones de autenticación (login, recovery, etc).
 * Usa 'error' singular para mensajes globales (sin campos).
 */
export interface AuthActionResult {
    error?: string;
    success?: boolean;
    message?: string;
}

/**
 * Estado de login (para formularios).
 */
export interface LoginState {
    error?: string;
    success?: boolean;
}

/**
 * Resultado de operaciones masivas sobre usuarios.
 */
export type UserStatusResult = Omit<ActionResponse, "message"> & {
    message: string;
    errorIds?: string[];
}