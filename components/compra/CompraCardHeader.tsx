import { formatPrecio } from "@/lib/utils/format";

interface CompraCardHeaderProps {
  fecha: string;
  total: number;
  itemCount: number;
}

function formatFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}

export default function CompraCardHeader({
  fecha,
  total,
  itemCount,
}: CompraCardHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3 px-5 bg-brand-bg/50 border-b border-brand-accent/10">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-brand-text">
          {formatFecha(fecha)}
        </h2>
        <span className="text-xs text-brand-secondary">
          {itemCount} {itemCount === 1 ? "libro" : "libros"}
        </span>
      </div>
      <span className="text-sm font-bold text-brand-primary">
        {formatPrecio(total)}
      </span>
    </div>
  );
}
