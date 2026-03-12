import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export default function Input({ label, id, className, required, ...props }: InputProps) {
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
        className={`w-full px-4 py-2.5 rounded-lg border border-brand-secondary
          bg-brand-bg text-brand-text
          placeholder:text-brand-accent
          focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:border-brand-primary
          transition-all duration-150 shadow-sm
          ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
