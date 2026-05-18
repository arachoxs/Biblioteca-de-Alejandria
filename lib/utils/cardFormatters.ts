export function formatCardNumber(value: string): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
  return digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatCVV(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}