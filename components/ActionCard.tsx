import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  href: string;
  title: string;
  description: string;
  category: string;
  icon: LucideIcon;
  categoryIcon?: LucideIcon;
  delayClass?: string;
}

export default function ActionCard({
  href,
  title,
  description,
  category,
  icon: Icon,
  categoryIcon: CategoryIcon,
  delayClass = "delay-150",
}: ActionCardProps) {
  const CatIcon = CategoryIcon || Icon;

  return (
    <Link
      href={href}
      className={`group relative bg-white border border-brand-accent/20 rounded-xl p-6 flex flex-col gap-4 text-brand-text hover:border-brand-accent/40 shadow-sm hover:shadow-lg hover:shadow-brand-text/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-both overflow-hidden hover:-translate-y-0.5 ${delayClass}`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

      <div className="w-11 h-11 border border-brand-accent/25 rounded-lg flex items-center justify-center bg-brand-bg/60 shrink-0 group-hover:bg-brand-primary/5 transition-colors">
        <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold text-brand-text tracking-tight mb-1.5">
          {title}
        </h2>
        <p className="text-sm text-brand-secondary leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-brand-accent/10 mt-auto">
        <span className="text-[10px] uppercase tracking-widest text-brand-accent font-medium">
          {category}
        </span>
        <div className="w-6 h-6 rounded-full border border-brand-accent/25 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
          <CatIcon className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
