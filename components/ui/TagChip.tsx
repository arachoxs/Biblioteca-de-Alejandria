"use client";

export interface TagChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export function TagChip({ label, isSelected, onClick }: TagChipProps) {
  const baseClasses =
    "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer";

  const inactiveClasses =
    "border border-brand-accent/30 bg-brand-bg text-brand-text hover:border-brand-accent/60 focus:ring-brand-accent/60";

  const activeClasses =
    "border-2 border-brand-primary bg-brand-primary/10 text-brand-primary hover:border-brand-primary/70 focus:ring-brand-accent/60";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${isSelected ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
}