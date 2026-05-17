"use client";

import type React from "react";
import { useState, useCallback } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useValidation } from "@/hooks/useValidation";
import { formatCardNumber, formatCVV } from "@/lib/utils/cardFormatters";
import {
  validateCardHolderName,
  validateCardNumber,
  validateCVV,
  validateExpiryMonth,
  validateExpiryYear,
  validateExpiryDate,
  validateBalance,
} from "@/lib/validations/tarjeta";

// ─── Iconos ────────────────────────────────────────────────────────

const cardAddIcon = (
  <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7" />
    <path d="M3 10h18" />
    <path d="M7 15h.01" />
    <path d="M11 15h2" />
    <path d="M16 19h6" />
    <path d="M19 16v6" />
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

// ─── Tipos ─────────────────────────────────────────────────────────

type AddCardFormValues = {
  nombre_titular: string;
  numero_tarjeta: string;
  cvv: string;
  mes_caducidad: string;
  ano_caducidad: string;
  saldo: string;
};

// ─── Opciones de selects ───────────────────────────────────────────

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1).padStart(2, "0"),
}));

function getYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 15 }, (_, i) => ({
    value: String(currentYear + i),
    label: String(currentYear + i),
  }));
}

// ─── Componente ────────────────────────────────────────────────────

interface AddCardFormProps {
  onSubmit: (data: {
    nombre_titular: string;
    numero_tarjeta: string;
    cvv: string;
    mes_caducidad: number;
    ano_caducidad: number;
    saldo: number;
  }) => Promise<{ success: boolean; errors?: Record<string, string> }>;
  onBack: () => void;
}

export default function AddCardForm({ onSubmit, onBack }: AddCardFormProps) {
  const [isPending, setIsPending] = useState(false);

  const validateForm = useCallback((values: AddCardFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};

    const nameErr = validateCardHolderName(values.nombre_titular);
    if (nameErr) errors.nombre_titular = nameErr;

    // Strip spaces for validation (visual formatting only)
    const rawNumber = values.numero_tarjeta.replace(/\s/g, "");
    const numErr = validateCardNumber(rawNumber);
    if (numErr) errors.numero_tarjeta = numErr;

    const cvvErr = validateCVV(values.cvv);
    if (cvvErr) errors.cvv = cvvErr;

    const month = values.mes_caducidad ? parseInt(values.mes_caducidad, 10) : null;
    const monthErr = validateExpiryMonth(month);
    if (monthErr) errors.mes_caducidad = monthErr;

    const year = values.ano_caducidad ? parseInt(values.ano_caducidad, 10) : null;
    const yearErr = validateExpiryYear(year);
    if (yearErr) errors.ano_caducidad = yearErr;

    if (!monthErr && !yearErr && month && year) {
      const expiryErr = validateExpiryDate(month, year);
      if (expiryErr) errors.fecha_caducidad = expiryErr;
    }

    if (values.saldo) {
      const saldoNum = parseFloat(values.saldo);
      const balErr = validateBalance(saldoNum);
      if (balErr) errors.saldo = balErr;
    }

    return errors;
  }, []);

  const { values, errors, handleChange, handleBlur, setErrors } = useValidation<AddCardFormValues>(
    {
      nombre_titular: "",
      numero_tarjeta: "",
      cvv: "",
      mes_caducidad: "",
      ano_caducidad: "",
      saldo: "",
    },
    validateForm,
  );

  // Format card number input with spaces every 4 digits
  function handleCardNumberChange(rawValue: string) {
    handleChange("numero_tarjeta", formatCardNumber(rawValue));
  }

  function handleCVVChange(rawValue: string) {
    handleChange("cvv", formatCVV(rawValue));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const rawNumber = values.numero_tarjeta.replace(/\s/g, "");
    const data = {
      nombre_titular: values.nombre_titular,
      numero_tarjeta: rawNumber,
      cvv: values.cvv,
      mes_caducidad: parseInt(values.mes_caducidad, 10),
      ano_caducidad: parseInt(values.ano_caducidad, 10),
      saldo: values.saldo ? parseFloat(values.saldo) : 0,
    };

    setIsPending(true);
    const result = await onSubmit(data);
    setIsPending(false);

    if (!result.success && result.errors && !result.errors.form) {
      setErrors(result.errors);
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
            {cardAddIcon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-primary">Agregar tarjeta</h3>
            <p className="text-xs text-brand-accent">Ingresa los datos de tu tarjeta</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-brand-accent/15 mb-1" />

      {/* Name */}
      <Input
        id="add-card-name"
        name="nombre_titular"
        label="Nombre del titular"
        type="text"
        placeholder="Como aparece en la tarjeta"
        required
        disabled={isPending}
        value={values.nombre_titular}
        onChange={(e) => handleChange("nombre_titular", e.target.value)}
        onBlur={() => handleBlur("nombre_titular")}
        error={errors.nombre_titular}
      />

      {/* Card number */}
      <Input
        id="add-card-number"
        name="numero_tarjeta"
        label="Número de tarjeta"
        type="text"
        inputMode="numeric"
        placeholder="0000 0000 0000 0000"
        required
        maxLength={19}
        disabled={isPending}
        value={values.numero_tarjeta}
        onChange={(e) => handleCardNumberChange(e.target.value)}
        onBlur={() => handleBlur("numero_tarjeta")}
        error={errors.numero_tarjeta}
      />

      {/* CVV */}
      <Input
        id="add-card-cvv"
        name="cvv"
        label="CVV"
        type="password"
        inputMode="numeric"
        placeholder="•••"
        required
        maxLength={4}
        disabled={isPending}
        value={values.cvv}
        onChange={(e) => handleCVVChange(e.target.value)}
        onBlur={() => handleBlur("cvv")}
        error={errors.cvv}
      />

      {/* Expiry */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          id="add-card-month"
          label="Mes"
          options={MONTH_OPTIONS}
          required
          disabled={isPending}
          value={values.mes_caducidad}
          onChange={(e) => handleChange("mes_caducidad", e.target.value)}
          onBlur={() => handleBlur("mes_caducidad")}
          error={errors.mes_caducidad}
        />
        <Select
          id="add-card-year"
          label="Año"
          options={getYearOptions()}
          required
          disabled={isPending}
          value={values.ano_caducidad}
          onChange={(e) => handleChange("ano_caducidad", e.target.value)}
          onBlur={() => handleBlur("ano_caducidad")}
          error={errors.ano_caducidad}
        />
      </div>
      {errors.fecha_caducidad && (
        <p className="text-xs text-red-500 -mt-2">{errors.fecha_caducidad}</p>
      )}

      {/* Initial balance */}
      <Input
        id="add-card-balance"
        name="saldo"
        label="Saldo inicial (opcional)"
        type="number"
        inputMode="numeric"
        placeholder="0"
        min={0}
        step={1}
        disabled={isPending}
        value={values.saldo}
        onChange={(e) => handleChange("saldo", e.target.value)}
        onBlur={() => handleBlur("saldo")}
        error={errors.saldo}
      />

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 mt-2"
      >
        {isPending ? (
          <>
            {spinnerIcon}
            Registrando…
          </>
        ) : (
          "Registrar tarjeta"
        )}
      </Button>
    </form>
  );
}
