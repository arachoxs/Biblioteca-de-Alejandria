"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Stepper from "@/components/ui/Stepper";
import InfoBox from "@/components/ui/InfoBox";
import CodeInput from "@/components/ui/CodeInput";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const STEPS = [
  { label: "Correo" },
  { label: "Código" },
  { label: "Contraseña" },
];

export default function PasswordRecoveryForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  const maskEmail = (raw: string): string => {
    const [user, domain] = raw.split("@");
    if (!user || !domain) return raw;
    const visible = user.slice(0, 1);
    return `${visible}${"•".repeat(Math.max(user.length - 1, 2))}@${domain}`;
  };

  const handleStepOne = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const rawEmail = (fd.get("email") as string).trim();
    if (!rawEmail) return;
    setEmail(rawEmail);
    setMaskedEmail(maskEmail(rawEmail));
    setCurrentStep(2);
  };

  const handleStepTwo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length < 6) return;
    setCurrentStep(3);
  };

  const handleStepThree = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Backend logic will be implemented later
  };

  return (
    <div className="w-full max-w-[440px] mx-auto animate-[fadeUp_0.6s_ease-out_both]">

      {/* Header */}
      <div className="text-center mb-10">
        {/* Mail icon */}
        <div className="w-14 h-14 mx-auto mb-5 border-2 border-brand-accent rounded-full grid place-items-center">
          <svg
            className="w-6 h-6 text-brand-primary"
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
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-brand-primary tracking-tight leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Recuperar Contraseña
        </h1>
        <span className="block w-15 h-[3px] bg-brand-accent mx-auto my-4 rounded-sm" />
        <p className="text-sm text-brand-secondary font-light max-w-[360px] mx-auto leading-relaxed">
          Sigue los pasos para restablecer tu contraseña mediante un código enviado a tu correo.
        </p>
      </div>

      {/* ─── Step 1: Email ─── */}
      {currentStep === 1 && (
        <form
          onSubmit={handleStepOne}
          autoComplete="off"
          className="bg-white border border-brand-accent/25 rounded-md
            px-7 py-8 md:px-10 md:py-10
            shadow-[0_1px_3px_rgba(10,9,8,0.04),0_8px_30px_rgba(10,9,8,0.06)]"
        >
          <Stepper steps={STEPS} currentStep={1} />

          <h2
            className="text-lg font-semibold text-brand-secondary mb-5 pb-2 border-b border-brand-accent/20 tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Ingresa tu correo electrónico
          </h2>

          <InfoBox>
            Te enviaremos un código de 6 dígitos a tu correo registrado para verificar tu identidad.
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

          <div className="mt-6">
            <Button type="submit" className="flex items-center justify-center gap-2">
              Enviar código
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
            </Button>
          </div>

          <p className="text-center text-sm text-brand-secondary font-light mt-5">
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
          className="bg-white border border-brand-accent/25 rounded-md
            px-7 py-8 md:px-10 md:py-10
            shadow-[0_1px_3px_rgba(10,9,8,0.04),0_8px_30px_rgba(10,9,8,0.06)]"
        >
          <Stepper steps={STEPS} currentStep={2} />

          <h2
            className="text-lg font-semibold text-brand-secondary mb-5 pb-2 border-b border-brand-accent/20 tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Ingresa el código de verificación
          </h2>

          <InfoBox
            icon={
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
            }
          >
            Hemos enviado un código a <strong>{maskedEmail}</strong>. Ingresa los 6 dígitos a continuación.
          </InfoBox>

          <CodeInput value={code} onChange={setCode} />

          <p className="text-center text-[0.78rem] text-brand-secondary font-light mb-6">
            ¿No recibiste el código?{" "}
            <button
              type="button"
              className="text-brand-primary font-medium border-b border-transparent hover:border-brand-primary transition-colors cursor-pointer"
            >
              Reenviar código
            </button>
          </p>

          <Button type="submit" className="flex items-center justify-center gap-2">
            Verificar código
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
          </Button>

          <p className="text-center text-sm text-brand-secondary font-light mt-5">
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
          className="bg-white border border-brand-accent/25 rounded-md
            px-7 py-8 md:px-10 md:py-10
            shadow-[0_1px_3px_rgba(10,9,8,0.04),0_8px_30px_rgba(10,9,8,0.06)]"
        >
          <Stepper steps={STEPS} currentStep={3} />

          <h2
            className="text-lg font-semibold text-brand-secondary mb-5 pb-2 border-b border-brand-accent/20 tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Crea tu nueva contraseña
          </h2>

          <div className="flex flex-col gap-5 mb-6">
            <div>
              <Input
                id="new-password"
                name="new_password"
                label="Nueva Contraseña"
                type="password"
                placeholder="••••••••"
                required
              />
              <span className="text-[0.7rem] text-brand-accent font-light mt-1 block">
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

          <Button type="submit" className="flex items-center justify-center gap-2">
            Restablecer contraseña
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
          </Button>

          <p className="text-center text-sm text-brand-secondary font-light mt-5">
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
