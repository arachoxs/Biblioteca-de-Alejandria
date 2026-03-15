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
      className={`group relative bg-white border border-brand-accent/20 rounded-xl p-8 flex flex-col gap-5 text-brand-text hover:border-brand-accent/40 shadow-sm hover:shadow-xl hover:shadow-brand-text/5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 fill-mode-both overflow-hidden hover:-translate-y-1 ${delayClass}`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />

      <div className="w-12 h-12 border-2 border-brand-accent/30 rounded-lg flex items-center justify-center bg-brand-bg/80 shrink-0 group-hover:bg-brand-primary/5 transition-colors">
        <Icon className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
      </div>

      <div className="flex-1">
        <h2 className="font-display text-xl font-bold text-brand-text tracking-wide mb-2">
          {title}
        </h2>
        <p className="text-sm text-brand-secondary leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-brand-accent/15 mt-auto">
        <span className="text-xs uppercase tracking-widest text-brand-accent font-medium">
          {category}
        </span>
        <div className="w-7 h-7 rounded-full border border-brand-accent/30 flex items-center justify-center group-hover:bg-brand-primary group-hover:border-brand-primary transition-colors">
          <CatIcon className="w-3 h-3 text-brand-primary group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
