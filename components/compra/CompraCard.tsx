import Link from "next/link";
import type { CompraConItems } from "@/lib/types/compra";
import CompraCardHeader from "./CompraCardHeader";
import CompraItemCard from "./CompraItemCard";

interface CompraCardProps {
  compra: CompraConItems;
}

export default function CompraCard({ compra }: CompraCardProps) {
  return (
    <article className="bg-white rounded-xl border border-brand-accent/15 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
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
        <Link
          href={`/historial-compras/${compra.id}`}
          className="inline-block px-4 py-2 text-xs font-medium rounded-lg border border-brand-accent/20 bg-white text-brand-secondary hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 cursor-pointer transition-colors"
        >
          Ver detalle de compra
        </Link>
      </div>
    </article>
  );
}
