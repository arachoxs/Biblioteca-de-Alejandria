"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Link from "next/link";

const initialState: LoginState = {};

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <div className="w-full max-w-md mx-auto space-y-8">

            {/* Encabezado */}
            <div className="text-center space-y-3">
                {/* Ícono de candado */}
                <div className="w-14 h-14 mx-auto border-2 border-brand-accent rounded-full grid place-items-center">
                    <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-brand-primary tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Iniciar Sesión
                </h1>
                <div className="w-15 h-0.5 bg-brand-accent mx-auto rounded-full" />
            </div>

            {/* Card del formulario */}
            <form
                action={formAction}
                className="grainy-glass rounded-2xl p-8 md:p-10 space-y-6"
            >
                {/* Mensaje de error global */}
                {state.error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center animate-pulse">
                        {state.error}
                    </div>
                )}

                {/* Campos */}
                <Input
                    id="email"
                    name="email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required
                    autoComplete="email"
                />

                <Input
                    id="password"
                    name="password"
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                />

                {/* Opciones: Recordarme / Olvidé contraseña */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="remember"
                            className="w-4 h-4 rounded border-brand-secondary accent-brand-primary cursor-pointer"
                        />
                        <span className="text-sm text-brand-secondary font-light">Recordarme</span>
                    </label>
                    <Link
                        href="/recuperar-contrasena"
                        className="text-sm text-brand-primary font-medium hover:underline underline-offset-2 transition-all"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {/* Botón de envío */}
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex flex-row items-center justify-center gap-3"
                >
                    {isPending ? (
                        <>
                            <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Ingresando...
                        </>
                    ) : (
                        <>
                            Ingresar
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </>
                    )}
                </Button>

                {/* Enlace a registro */}
                <p className="text-center text-sm text-brand-secondary font-light">
                    ¿No tienes cuenta?{" "}
                    <Link href="/registro" className="text-brand-primary font-semibold hover:underline underline-offset-2 transition-all">
                        Regístrate aquí
                    </Link>
                </p>
            </form>
        </div>
    );
}
