import { ReactNode } from "react";

interface InfoBoxProps {
  children: ReactNode;
  icon?: ReactNode;
}

const defaultIcon = (
  <svg
    className="w-4 h-4 text-brand-secondary flex-shrink-0 mt-0.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function InfoBox({ children, icon }: InfoBoxProps) {
  return (
    <div className="flex items-start gap-2.5 mb-6 px-4 py-3.5 bg-brand-accent/8 rounded border-l-3 border-brand-accent">
      {icon ?? defaultIcon}
      <p className="text-[0.78rem] text-brand-secondary leading-relaxed font-light">
        {children}
      </p>
    </div>
  );
}
