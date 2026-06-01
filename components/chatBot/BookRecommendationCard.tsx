interface BookRecommendationCardProps {
  titulo: string;
  autor: string;
  categoria: string;
  precio: number;
  copias_disponibles: number;
}

export default function BookRecommendationCard({
  titulo,
  autor,
  categoria,
  precio,
  copias_disponibles,
}: BookRecommendationCardProps) {
  return (
    <div className="bg-brand-bg/50 border border-brand-accent/15 rounded-lg p-3 my-1">
      <h4 className="font-semibold text-sm text-brand-primary">{titulo}</h4>
      <p className="text-xs text-brand-secondary mt-0.5">{autor}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] px-2 py-0.5 bg-white border border-brand-accent/15 rounded text-brand-secondary">
          {categoria}
        </span>
        <span className="text-sm font-bold text-brand-text">
          ${precio.toLocaleString("es-CO")}
        </span>
      </div>
      <p className="text-[10px] text-green-600 mt-1.5">
        {copias_disponibles}{" "}
        {copias_disponibles === 1 ? "copia" : "copias"} disponible(s)
      </p>
    </div>
  );
}
