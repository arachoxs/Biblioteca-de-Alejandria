import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | boolean;
}

export default function Input({ label, id, className, required, error = false, onChange, ...props }: InputProps) {
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
      <input
        id={id}
        required={required}
        aria-invalid={hasError}
        onChange={onChange}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        className={`w-full px-4 py-2.5 rounded-lg border relative transition-all duration-150 shadow-sm
          bg-brand-bg text-brand-text
          placeholder:text-brand-accent
          focus:outline-none focus:ring-2
          ${hasError
            ? "border-red-500 focus:ring-red-400/60 focus:border-red-500"
            : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary"
          }
          ${className ?? ""}`}
        {...props}
      />
      {errorMessage && (
        <p id={`${id}-error`} className="text-xs absolute mt-18 text-red-500 mt-0.5">
          {errorMessage? errorMessage : "Error desconocido"}
        </p>
      )}
    </div>
  );
}
