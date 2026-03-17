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

export interface RegisterResponse { //respuesta que se envia al frontend
    success: boolean;
    errors?: Record<string, string>;
    message?: string;
}

export interface RecoveryState {
    error?: string;
    success?: boolean;
    message?: string;
}
