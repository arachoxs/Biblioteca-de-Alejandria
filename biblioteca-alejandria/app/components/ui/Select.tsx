import { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
}

export default function Select({ label, id, options, className, required, ...props }: SelectProps) {
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
        className={`w-full px-4 py-2.5 rounded-lg border border-brand-secondary
          bg-brand-bg text-brand-text
          focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:border-brand-primary
          transition-all duration-150 shadow-sm cursor-pointer
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
    </div>
  );
}
