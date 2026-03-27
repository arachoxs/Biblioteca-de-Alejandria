import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string | boolean;
}

export default function Input({ label, id, className, required, error = false, onChange, disabled, ...props }: InputProps) {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div className="flex flex-col gap-1.5 group">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-brand-primary tracking-wide flex items-center justify-between"
      >
        <span>
          {label}
          {required && !disabled && <span className="text-brand-primary ml-1">*</span>}
        </span>
        {disabled}
      </label>
      <div className="relative">
        <input
          id={id}
          required={required}
          aria-invalid={hasError}
          onChange={onChange}
          disabled={disabled}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          title={disabled ? "Este campo no puede ser modificado." : undefined}
          className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-300 shadow-sm
            bg-brand-bg text-brand-text
            placeholder:text-brand-accent
            focus:outline-none focus:ring-2
            ${disabled
              ? "opacity-90 bg-brand-secondary/5 border-dashed border-brand-secondary/40 text-brand-secondary cursor-not-allowed hover:bg-brand-secondary/10 pr-10 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
              : hasError
                ? "border-red-500 focus:ring-red-400/60 focus:border-red-500"
                : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary"
            }
            ${className ?? ""}`}
          {...props}
        />
        {disabled && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300">
            <svg className="w-4 h-4 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        )}
      </div>
      {errorMessage && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {errorMessage ? errorMessage : "Error desconocido"}
        </p>
      )}
    </div>
  );
}
