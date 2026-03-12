import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-brand-primary hover:bg-brand-secondary active:bg-brand-secondary text-brand-bg",
    secondary:
      "bg-transparent border border-brand-primary hover:bg-brand-primary text-brand-primary hover:text-brand-bg",
  };

  return (
    <button
      className={`w-full py-3 px-6 rounded-lg font-bold text-base tracking-wide
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2
        shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
