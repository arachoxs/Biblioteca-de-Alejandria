"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";
import { changePasswordAction } from "@/app/actions/authActions";
import { useValidation } from "@/hooks/useValidation";
import { validatePasswords, isPasswordValid } from "@/lib/validations/auth";

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

// ─── Tipos ─────────────────────────────────────────────────────────

type ChangePasswordFormValues = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

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
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Función de validación
  const validateForm = useCallback((values: ChangePasswordFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validar confirmación de contraseña (indicador visual maneja la principal)
    const passwordErrors = validatePasswords(values.new_password, values.confirm_password, true);
    if (passwordErrors?.confirmar_contrasena) {
      errors.confirm_password = passwordErrors.confirmar_contrasena;
    }

    return errors;
  }, []);

  // Hook de validación
  const { values, errors, handleChange, handleBlur, setErrors, touched } = useValidation<ChangePasswordFormValues>(
    {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    validateForm
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);
    setSubmitCount((prev) => prev + 1);

    // Validar todo el formulario antes de enviar
    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    // Verificar que la nueva contraseña sea válida
    if (!isPasswordValid(values.new_password)) {
      setServerError("Por favor, completa todos los requisitos de la contraseña.");
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const formData = new FormData(e.currentTarget);
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
      setServerError(result.error ?? "Error desconocido.");
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
        {serverError && (
          <Alert
            key={`error-${submitCount}`}
            variant="error"
          >
            {serverError}
          </Alert>
        )}
        {success && (
          <Alert
            key={`success-${submitCount}`}
            variant="success"
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
          value={values.current_password}
          onChange={(e) => handleChange("current_password", e.target.value)}
          onBlur={() => handleBlur("current_password")}
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
            value={values.new_password}
            onChange={(e) => handleChange("new_password", e.target.value)}
            onBlur={() => handleBlur("new_password")}
          />
          <div className="mt-3">
            <PasswordStrengthIndicator password={values.new_password} />
          </div>
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
          value={values.confirm_password}
          onChange={(e) => handleChange("confirm_password", e.target.value)}
          onBlur={() => handleBlur("confirm_password")}
          error={errors.confirm_password}
        />

        {/* Botón de envío */}
        <Button
          type="submit"
          disabled={isPending || success || Object.keys(errors).length > 0 || !values.current_password || !values.new_password || !values.confirm_password}
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
