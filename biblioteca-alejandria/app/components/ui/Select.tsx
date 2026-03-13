import { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string | boolean;
}

export default function Select({ label, id, options, className, required, error = false, ...props }: SelectProps) {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-brand-primary tracking-wide"
      >
        {label}
        {required && <span className="text-brand-primary ml-1">*</span>}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={hasError}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        className={`w-full px-4 py-3 rounded-lg border
          bg-brand-bg text-brand-text
          focus:outline-none focus:ring-2
          transition-all duration-150 shadow-sm cursor-pointer
          ${hasError
            ? "border-red-500 focus:ring-red-400/60 focus:border-red-500"
            : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary"
          }
          ${className ?? ""}`}
        {...props}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
