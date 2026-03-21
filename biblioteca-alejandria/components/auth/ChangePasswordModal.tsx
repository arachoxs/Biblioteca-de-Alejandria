"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { changePasswordAction } from "@/app/actions/authActions";

// ─── Iconos ────────────────────────────────────────────────────────

const lockIcon = (
  <svg
    className="w-8 h-8 text-brand-primary"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitCount((prev) => prev + 1);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    // Validación client-side rápida
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setIsPending(true);
    const result = await changePasswordAction(formData);
    setIsPending(false);

    if (result.success) {
      setSuccess(true);
      // Redirigir a login tras un breve delay para que el usuario vea el mensaje
      setTimeout(() => {
        onClose();
        router.push("/login");
      }, 1500);
    } else {
      setError(result.error ?? "Error desconocido.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña">
      <form onSubmit={handleSubmit} className="space-y-5 relative" autoComplete="off">
        {/* Icono decorativo */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-14 h-14 bg-brand-accent/15 rounded-full flex items-center justify-center">
            {lockIcon}
          </div>
          <div className="w-10 h-0.5 bg-brand-accent/50 rounded-full mt-3" />
        </div>

        {/* Alertas */}
        {error && (
          <Alert
            key={`error-${submitCount}`}
            variant="error"
            className="top-1"
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            key={`success-${submitCount}`}
            variant="success"
            className="top-1"
          >
            Contraseña actualizada. Redirigiendo al inicio de sesión…
          </Alert>
        )}

        {/* Campos */}
        <Input
          id="current-password"
          name="current_password"
          label="Contraseña actual"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isPending || success}
        />

        <div>
          <Input
            id="new-password"
            name="new_password"
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            disabled={isPending || success}
          />
          <span className="text-xs text-brand-accent font-light mt-1 block">
            Mínimo 8 caracteres.
          </span>
        </div>

        <Input
          id="confirm-password"
          name="confirm_password"
          label="Confirmar nueva contraseña"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isPending || success}
        />

        {/* Botón de envío */}
        <Button
          type="submit"
          disabled={isPending || success}
          className="flex items-center justify-center gap-2 mt-2"
        >
          {isPending ? (
            <>
              {spinnerIcon}
              Actualizando…
            </>
          ) : success ? (
            "✓ Contraseña actualizada"
          ) : (
            "Cambiar contraseña"
          )}
        </Button>
      </form>
    </Modal>
  );
}
