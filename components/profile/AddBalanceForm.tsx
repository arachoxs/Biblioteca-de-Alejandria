"use client";

import type React from "react";
import { useState, useCallback } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { useValidation } from "@/hooks/useValidation";
import { validateBalance } from "@/lib/validations/tarjeta";
import type { TarjetaListItem } from "@/services/tarjeta/tarjetaService";

// ─── Iconos ────────────────────────────────────────────────────────

const walletIcon = (
  <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const spinnerIcon = (
  <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const arrowLeftIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const cardMiniIcon = (
  <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <path d="M1 10h22" />
  </svg>
);

// ─── Helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Tipos ─────────────────────────────────────────────────────────

type AddBalanceFormValues = {
  amount: string;
};

// ─── Componente ────────────────────────────────────────────────────

interface AddBalanceFormProps {
  tarjeta: TarjetaListItem;
  onSubmit: (tarjetaId: number, amount: number) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  onBack: () => void;
}

export default function AddBalanceForm({ tarjeta, onSubmit, onBack }: AddBalanceFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const validateForm = useCallback((values: AddBalanceFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!values.amount || values.amount.trim() === "") {
      errors.amount = "El monto es obligatorio.";
      return errors;
    }

    const amountNum = parseFloat(values.amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = "El monto debe ser mayor a 0.";
      return errors;
    }

    if (amountNum > 1000000) {
      errors.amount = "El monto no puede exceder $1'000.000 por operación.";
      return errors;
    }

    const balErr = validateBalance(amountNum);
    if (balErr) errors.amount = balErr;

    return errors;
  }, []);

  const { values, errors, handleChange, handleBlur, setErrors } = useValidation<AddBalanceFormValues>(
    { amount: "" },
    validateForm,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);
    setSubmitCount((p) => p + 1);

    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const amount = parseFloat(values.amount);

    setIsPending(true);
    const result = await onSubmit(tarjeta.id, amount);
    setIsPending(false);

    if (result.success) {
      setSuccess(true);
    } else {
      if (result.errors?.form) {
        setServerError(result.errors.form);
      } else if (result.errors?.amount) {
        setErrors({ amount: result.errors.amount });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 relative" autoComplete="off">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-full text-brand-secondary/70 hover:bg-brand-accent/10 hover:text-brand-primary transition-all cursor-pointer"
          title="Volver"
        >
          {arrowLeftIcon}
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-accent/12 rounded-full flex items-center justify-center">
            {walletIcon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-primary">Agregar saldo</h3>
            <p className="text-xs text-brand-accent">Recarga el saldo de tu tarjeta</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-brand-accent/15 mb-1" />

      {/* Selected card summary */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg border border-brand-accent/15">
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 grid place-items-center flex-shrink-0">
          {cardMiniIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-primary truncate">
            •••• {tarjeta.ultimos_cuatro_digitos}
          </p>
          <p className="text-xs text-brand-accent truncate">
            {tarjeta.nombre_titular}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-brand-accent">Saldo actual</p>
          <p className="text-sm font-semibold text-brand-primary">
            {formatCurrency(tarjeta.saldo)}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {serverError && (
        <Alert key={`error-${submitCount}`} variant="error">
          {serverError}
        </Alert>
      )}
      {success && (
        <Alert key={`success-${submitCount}`} variant="success">
          Saldo añadido correctamente.
        </Alert>
      )}

      {/* Amount */}
      <Input
        id="add-balance-amount"
        name="amount"
        label="Monto a agregar"
        type="number"
        inputMode="numeric"
        placeholder="Ej: 50000"
        required
        min={1}
        step={1}
        disabled={isPending || success}
        value={values.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        onBlur={() => handleBlur("amount")}
        error={errors.amount}
      />

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending || success}
        className="flex items-center justify-center gap-2 mt-2"
      >
        {isPending ? (
          <>
            {spinnerIcon}
            Procesando…
          </>
        ) : success ? (
          "✓ Saldo añadido"
        ) : (
          "Agregar saldo"
        )}
      </Button>
    </form>
  );
}
