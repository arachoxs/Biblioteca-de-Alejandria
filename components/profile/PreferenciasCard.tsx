"use client";

interface PreferenciasCardProps {
  authorCount: number;
  categoryCount: number;
  onOpen: () => void;
}

export default function PreferenciasCard({
  authorCount,
  categoryCount,
  onOpen,
}: PreferenciasCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left bg-white border border-brand-accent/25 rounded-lg p-6 shadow-[0_1px_3px_rgba(10,9,8,0.04)] transition-all hover:border-brand-primary hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group w-full"
    >
      <div className="w-12 h-12 rounded-full bg-brand-accent/12 grid place-items-center mb-3">
        <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h3 className="font-display text-lg font-semibold text-brand-primary mb-1.5 tracking-wide group-hover:underline underline-offset-2">
        Preferencias Literarias
      </h3>
      <p className="text-sm text-brand-secondary font-light leading-relaxed">
        Administra tus géneros favoritos y recibe recomendaciones personalizadas de libros.
      </p>
      <div className="mt-3 flex gap-2">
        {authorCount > 0 && (
          <span className="text-xs bg-brand-accent/15 text-brand-secondary px-2 py-0.5 rounded-full">
            {authorCount} autores
          </span>
        )}
        {categoryCount > 0 && (
          <span className="text-xs bg-brand-accent/15 text-brand-secondary px-2 py-0.5 rounded-full">
            {categoryCount} categorías
          </span>
        )}
      </div>
    </button>
  );
}
