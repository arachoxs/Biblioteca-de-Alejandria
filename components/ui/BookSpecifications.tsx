"use client";

interface BibliographicItem {
  label: string;
  value: string | null | undefined;
}

interface BookSpecificationsProps {
  bibliographicData: BibliographicItem[];
}

export default function BookSpecifications({ bibliographicData }: BookSpecificationsProps) {
  return (
    <div className="border-t border-brand-accent/20 pt-8">
      <h3 className="font-display text-xl md:text-2xl text-brand-primary mb-6">
        Especificaciones
      </h3>
      <dl className="divide-y divide-brand-accent/20 border-b border-brand-accent/20">
        {bibliographicData.map(({ label, value }) => (
          <div key={label} className="py-4 flex justify-between items-center group">
            <dt className="text-xs font-semibold uppercase tracking-widest text-brand-secondary w-1/3">
              {label}
            </dt>
            <dd className="text-base text-brand-text w-2/3 text-right group-hover:text-brand-primary transition-colors">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}