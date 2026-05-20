"use client";

interface BookSynopsisProps {
  sinopsis: string | null | undefined;
}

export default function BookSynopsis({ sinopsis }: BookSynopsisProps) {
  if (!sinopsis) return null;

  return (
    <div className="mb-8">
      <h3 className="font-display text-xl md:text-2xl text-brand-primary mb-4">
        Descripción
      </h3>
      <p className="text-base md:text-lg text-brand-text/80 leading-relaxed">
        {sinopsis}
      </p>
    </div>
  );
}