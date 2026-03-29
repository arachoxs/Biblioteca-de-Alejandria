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

export default function Select({ label, id, options, className, required, error = false, disabled, ...props }: SelectProps) {
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
      <div className="relative group">
        <select
          id={id}
          required={required}
          aria-invalid={hasError}
          disabled={disabled}
          title={disabled ? "Este campo no puede ser modificado." : undefined}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 shadow-sm
            bg-brand-bg text-brand-text appearance-none
            focus:outline-none focus:ring-2
            ${disabled
              ? "opacity-90 bg-brand-secondary/5 border-dashed border-brand-secondary/40 text-brand-secondary cursor-not-allowed hover:bg-brand-secondary/10"
              : hasError
                ? "border-red-500 focus:ring-red-400/60 focus:border-red-500 cursor-pointer"
                : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary cursor-pointer"
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
        {!disabled && (
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-brand-secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        )}
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
          {errorMessage}
        </p>
      )}
    </div>
  );
}
