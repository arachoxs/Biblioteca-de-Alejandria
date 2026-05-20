"use client";

interface BookHeaderProps {
  autorNombre: string | null | undefined;
  libroTitulo: string | null | undefined;
  formattedPrice: string;
  estado: string | null | undefined;
}

function capitalize(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function BookHeader({ autorNombre, libroTitulo, formattedPrice, estado }: BookHeaderProps) {
  return (
    <>
      {autorNombre && (
        <p className="text-lg md:text-xl text-brand-secondary font-medium tracking-wide mb-2">
          {autorNombre}
        </p>
      )}

      <h1 className="font-display text-3xl md:text-5xl text-brand-primary leading-tight mb-6">
        {libroTitulo || "Título no disponible"}
      </h1>

      <div className="flex items-center gap-4 mb-6 border-b border-brand-accent/20 pb-6">
        <span className="text-2xl md:text-3xl font-semibold text-brand-text">
          {formattedPrice}
        </span>
        {estado && (
          <>
            <div className="h-5 w-px bg-brand-accent/40" />
            <span className="inline-flex items-center px-3 py-1 bg-brand-bg rounded-sm text-xs uppercase tracking-widest text-brand-secondary border border-brand-accent/20">
              {capitalize(estado)}
            </span>
          </>
        )}
      </div>
    </>
  );
}