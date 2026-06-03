import type { CompraConItems } from "@/lib/types/compra";
import CompraCardHeader from "./CompraCardHeader";
import CompraItemCard from "./CompraItemCard";

interface CompraCardProps {
  compra: CompraConItems;
}

export default function CompraCard({ compra }: CompraCardProps) {
  return (
    <article className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden">
      <CompraCardHeader
        fecha={compra.fecha}
        total={compra.total}
        itemCount={compra.items.length}
      />
      <div>
        {compra.items.map((item, index) => (
          <CompraItemCard key={item.libro?.id ?? `item-${index}`} item={item} />
        ))}
      </div>
      <div className="px-5 py-3 border-t border-brand-accent/10">
        <button
          disabled
          className="px-4 py-2 text-xs font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-secondary/40 cursor-not-allowed"
          title="Próximamente"
        >
          Ver detalle de compra
        </button>
      </div>
    </article>
  );
}
