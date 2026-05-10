import { BookOpen } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-4 border-t border-brand-accent/15 bg-brand-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-primary" strokeWidth={1.5} />
            </div>
            <span className="font-display text-sm text-brand-secondary">
              Biblioteca de Alejandría
            </span>
          </div>

          <p className="text-xs text-brand-secondary/60 text-center">
            © {currentYear} Biblioteca de Alejandría. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}