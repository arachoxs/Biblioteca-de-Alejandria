import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  label?: string;
}

export default function BackLink({ href, label = "Volver" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm text-brand-secondary hover:text-brand-primary transition-colors duration-200 mb-6 group">
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
      <span>{label}</span>
    </Link>
  );
}