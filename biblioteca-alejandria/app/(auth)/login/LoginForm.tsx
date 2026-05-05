"use client";

import { useState, FormEvent } from "react";
import { loginAction } from "./actions";
import type { LoginState } from "@/lib/types/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Link from "next/link";

// ─── Iconos estáticos (hoisted fuera del componente) ───────────────

const lockIcon = (
  <svg
    className="w-6 h-6 text-brand-secondary flex-shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const arrowRightIcon = (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const spinnerIcon = (
  <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

// ─── Componente ────────────────────────────────────────────────────

export default function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string) ?? "";
    const password = (fd.get("password") as string) ?? "";

    setIsPending(true);
    const result: LoginState = await loginAction(email, password);
    setIsPending(false);

    if (result?.error) {
      setError(result.error);
    }
    // Si no hay error, loginAction redirige internamente
  };

  return (
    <div className="min-w-full mx-auto space-y-8">

      {/* Encabezado */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto border-2 border-brand-accent rounded-full grid place-items-center">
          {lockIcon}
        </div>
        <h1 className="text-4xl font-bold text-brand-primary tracking-tight font-display">
          Iniciar Sesión
        </h1>
        <div className="w-15 h-0.5 bg-brand-accent mx-auto rounded-full" />
      </div>

      {/* Mensaje de error global */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        autoComplete="on"
        className="space-y-6"
      >
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
            <span className="text-sm text-brand-secondary font-light">
              Recordarme
            </span>
          </label>
          <Link
            href="/password-recovery"
            className="text-sm text-brand-primary font-medium hover:underline underline-offset-2 transition-all"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Botón de envío */}
        <Button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              {spinnerIcon}
              Ingresando...
            </>
          ) : (
            <>
              Ingresar
              {arrowRightIcon}
            </>
          )}
        </Button>

        {/* Enlace a registro */}
        <p className="text-center text-sm text-brand-secondary font-light">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-brand-primary font-semibold hover:underline underline-offset-2 transition-all"
          >
            Regístrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
}
