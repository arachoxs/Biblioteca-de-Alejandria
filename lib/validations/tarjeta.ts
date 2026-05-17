import { sanitizeText } from "./rules";

const CARD_NUMBER_REGEX = /^\d{16}$/;
const CVV_REGEX = /^\d{3,4}$/;
const NAME_REGEX = /^[a-zA-Z\s]{3,100}$/;

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function validateCardHolderName(
  name: string | null | undefined
): string | null {
  if (!name || typeof name !== "string") {
    return "El nombre del titular es obligatorio.";
  }

  const sanitized = sanitizeText(name);

  if (!NAME_REGEX.test(sanitized)) {
    return "El nombre del titular debe contener solo letras y espacios, con un mínimo de 3 caracteres.";
  }

  if (sanitized.length < 3) {
    return "El nombre del titular debe tener al menos 3 caracteres.";
  }

  return null;
}

export function validateCardNumber(
  cardNumber: string | null | undefined
): string | null {
  if (!cardNumber || typeof cardNumber !== "string") {
    return "El número de tarjeta es obligatorio.";
  }

  const sanitized = cardNumber.trim();

  if (!CARD_NUMBER_REGEX.test(sanitized)) {
    return "El número de tarjeta debe contener exactamente 16 dígitos.";
  }

  if (!luhnCheck(sanitized)) {
    return "El número de tarjeta no es válido.";
  }

  return null;
}

export function validateCVV(cvv: string | null | undefined): string | null {
  if (!cvv || typeof cvv !== "string") {
    return "El CVV es obligatorio.";
  }

  const sanitized = cvv.trim();

  if (!CVV_REGEX.test(sanitized)) {
    return "El CVV debe contener exactamente 3 o 4 dígitos.";
  }

  return null;
}

function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

export function validateExpiryMonth(
  month: number | null | undefined
): string | null {
  if (month === null || month === undefined) {
    return "El mes de caducidad es obligatorio.";
  }

  if (isNaN(month) || !isValidMonth(month)) {
    return "El mes de caducidad debe ser un número entre 1 y 12.";
  }

  return null;
}

function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= currentYear && year <= currentYear + 20;
}

export function validateExpiryYear(
  year: number | null | undefined
): string | null {
  if (year === null || year === undefined) {
    return "El año de caducidad es obligatorio.";
  }

  if (isNaN(year) || !isValidYear(year)) {
    return `El año de caducidad debe ser un número de 4 dígitos mayor o igual a ${new Date().getFullYear()}.`;
  }

  return null;
}

export function validateExpiryDate(
  month: number,
  year: number
): string | null {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  if (year < currentYear) {
    return "La tarjeta ya ha expirado.";
  }

  if (year === currentYear && month < currentMonth) {
    return "La tarjeta ya ha expirado.";
  }

  return null;
}

export function validateBalance(
  balance: number | null | undefined
): string | null {
  if (typeof balance !== "number" || isNaN(balance)) {
    return "El saldo debe ser un número válido.";
  }

  if (balance < 0) {
    return "El saldo no puede ser negativo.";
  }

  if (balance > 1000000) {
    return "El saldo inicial no puede exceder $1'000.000.";
  }

  return null;
}

export interface TarjetaValidationPayload {
  nombre_titular: string;
  numero_tarjeta: string;
  cvv: string;
  mes_caducidad: number;
  ano_caducidad: number;
  saldo?: number;
}

function validateCardIdentity(
  payload: TarjetaValidationPayload
): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameErr = validateCardHolderName(payload.nombre_titular);
  if (nameErr) errors.nombre_titular = nameErr;

  const numErr = validateCardNumber(payload.numero_tarjeta);
  if (numErr) errors.numero_tarjeta = numErr;

  const cvvErr = validateCVV(payload.cvv);
  if (cvvErr) errors.cvv = cvvErr;

  return errors;
}

function combineValidationResults(
  monthErr: string | null,
  yearErr: string | null,
  month: number | undefined,
  year: number | undefined
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (monthErr) errors.mes_caducidad = monthErr;
  if (yearErr) errors.ano_caducidad = yearErr;

  if (monthErr === null && yearErr === null) {
    const expiryErr = validateExpiryDate(month as number, year as number);
    if (expiryErr) errors.fecha_caducidad = expiryErr;
  }

  return errors;
}

export function validateTarjeta(
  payload: TarjetaValidationPayload
): Record<string, string> {
  const identityErrors = validateCardIdentity(payload);
  const expiryErrors = combineValidationResults(
    validateExpiryMonth(payload.mes_caducidad),
    validateExpiryYear(payload.ano_caducidad),
    payload.mes_caducidad,
    payload.ano_caducidad
  );

  const errors: Record<string, string> = {
    ...identityErrors,
    ...expiryErrors,
  };

  if (payload.saldo !== undefined) {
    const balanceErr = validateBalance(payload.saldo);
    if (balanceErr) errors.saldo = balanceErr;
  }

  return errors;
}