import Link from "next/link";
import { BookMarked } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-center space-y-6">
        <BookMarked className="w-16 h-16 mx-auto text-brand-accent" strokeWidth={1.5} />
        <h1 className="font-display text-6xl text-brand-primary">404</h1>
        <h2 className="font-display text-3xl text-brand-text">Página no encontrada</h2>
        <p className="text-brand-secondary">La página que buscas no existe o fue movida.</p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}