"use client";

import { useState, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Stepper from "@/components/ui/Stepper";
import InfoBox from "@/components/ui/InfoBox";
import CodeInput from "@/components/ui/CodeInput";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import {
  sendRecoveryCode,
  verifyRecoveryCode,
  resetPassword,
  type RecoveryState,
} from "./actions";

// ─── Constantes ────────────────────────────────────────────────────

const STEPS = [
  { label: "Correo" },
  { label: "Código" },
  { label: "Contraseña" },
];

const RESEND_COOLDOWN_SECONDS = 60;

// ─── Iconos estáticos (hoisted fuera del componente) ───────────────

const emailIcon = (
  <svg
    className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const sendIcon = (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const checkIcon = (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const lockIcon = (
  <svg
    className="w-4 h-4"
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

// ─── Helpers ───────────────────────────────────────────────────────

function maskEmail(raw: string): string {
  const [user, domain] = raw.split("@");
  if (!user || !domain) return raw;
  const visible = user.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(user.length - 1, 2))}@${domain}`;
}

// ─── Componente ────────────────────────────────────────────────────

export default function PasswordRecoveryForm() {
  const router = useRouter();

  // Estado del flujo
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  // Estado de UI
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── Cooldown del reenvío ──────────────────────────────────────

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── Helpers de estado ─────────────────────────────────────────

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleActionResult = (result: RecoveryState): boolean => {
    if (result.error) {
      setError(result.error);
      return false;
    }
    if (result.message) {
      setSuccessMessage(result.message);
    }
    return result.success ?? false;
  };

  // ─── Step 1: Enviar código ────────────────────────────────────

  const handleStepOne = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    const fd = new FormData(e.currentTarget);
    const rawEmail = (fd.get("email") as string).trim();
    if (!rawEmail) return;

    setIsPending(true);
    const result = await sendRecoveryCode(rawEmail);
    setIsPending(false);

    if (handleActionResult(result)) {
      setEmail(rawEmail);
      setMaskedEmail(maskEmail(rawEmail));
      startResendCooldown();
      setCurrentStep(2);
    }
  };

  // ─── Step 2: Verificar código ─────────────────────────────────

  const handleStepTwo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    if (code.length < 8) {
      setError("Ingresa los 8 dígitos del código.");
      return;
    }

    setIsPending(true);
    const result = await verifyRecoveryCode(email, code);
    setIsPending(false);

    if (handleActionResult(result)) {
      setCurrentStep(3);
    }
  };

  // ─── Reenviar código ──────────────────────────────────────────

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;

    clearMessages();
    setIsPending(true);
    const result = await sendRecoveryCode(email);
    setIsPending(false);

    handleActionResult(result);
    setCode("");
    startResendCooldown();
  };

  // ─── Step 3: Nueva contraseña ─────────────────────────────────

  const handleStepThree = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();

    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get("new_password") as string;
    const confirmPassword = fd.get("confirm_password") as string;

    // Validación client-side rápida (el servidor valida de nuevo)
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsPending(true);
    const result = await resetPassword(newPassword, confirmPassword);
    setIsPending(false);

    if (result.success) {
      router.push("/login");
    } else {
      handleActionResult(result);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">

      {/* Encabezado */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto border-2 border-brand-accent rounded-full grid place-items-center">
          {emailIcon}
        </div>
        <h1
          className="text-4xl font-bold text-brand-primary tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Recuperar Contraseña
        </h1>
        <div className="w-15 h-0.5 bg-brand-accent mx-auto rounded-full" />
      </div>

      {/* Mensajes de error/éxito */}
      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : successMessage && currentStep < 3 ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}

      {/* ─── Step 1: Email ─── */}
      {currentStep === 1 && (
        <form
          onSubmit={handleStepOne}
          autoComplete="off"
          className="space-y-6"
        >
          <Stepper steps={STEPS} currentStep={1} />

          <InfoBox>
            Te enviaremos un código de 8 dígitos a tu correo registrado para
            verificar tu identidad.
          </InfoBox>

          <Input
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@correo.com"
            required
            defaultValue={email}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                {spinnerIcon}
                Enviando...
              </>
            ) : (
              <>
                Enviar código
                {sendIcon}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-brand-secondary font-light">
            <Link
              href="/login"
              className="text-brand-primary font-medium hover:underline underline-offset-2 transition-all"
            >
              ← Volver a Iniciar Sesión
            </Link>
          </p>
        </form>
      )}

      {/* ─── Step 2: Code ─── */}
      {currentStep === 2 && (
        <form
          onSubmit={handleStepTwo}
          autoComplete="off"
          className="space-y-6"
        >
          <Stepper steps={STEPS} currentStep={2} />

          <InfoBox icon={emailIcon}>
            Hemos enviado un código a <strong>{maskedEmail}</strong>. Ingresa
            los 8 dígitos a continuación.
          </InfoBox>

          <CodeInput value={code} onChange={setCode} length={8} />

          <p className="text-center text-sm text-brand-secondary font-light">
            ¿No recibiste el código?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isPending}
              className="text-brand-primary font-medium border-b border-transparent hover:border-brand-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : "Reenviar código"}
            </button>
          </p>

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                {spinnerIcon}
                Verificando...
              </>
            ) : (
              <>
                Verificar código
                {checkIcon}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-brand-secondary font-light">
            <Link
              href="/login"
              className="text-brand-primary font-medium hover:underline underline-offset-2 transition-all"
            >
              ← Volver a Iniciar Sesión
            </Link>
          </p>
        </form>
      )}

      {/* ─── Step 3: New Password ─── */}
      {currentStep === 3 && (
        <form
          onSubmit={handleStepThree}
          autoComplete="off"
          className="space-y-6"
        >
          <Stepper steps={STEPS} currentStep={3} />

          <div className="space-y-5">
            <div>
              <Input
                id="new-password"
                name="new_password"
                label="Nueva Contraseña"
                type="password"
                placeholder="••••••••"
                required
              />
              <span className="text-xs text-brand-accent font-light mt-1 block">
                Mínimo 8 caracteres, incluir mayúsculas y números.
              </span>
            </div>

            <Input
              id="confirm-password"
              name="confirm_password"
              label="Confirmar Contraseña"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                {spinnerIcon}
                Restableciendo...
              </>
            ) : (
              <>
                Restablecer contraseña
                {lockIcon}
              </>
            )}
          </Button>

          <p className="text-center text-sm text-brand-secondary font-light">
            <Link
              href="/login"
              className="text-brand-primary font-medium hover:underline underline-offset-2 transition-all"
            >
              ← Volver a Iniciar Sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
