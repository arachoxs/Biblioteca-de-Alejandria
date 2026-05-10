import LoginForm from "./LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Iniciar Sesión — Biblioteca de Alejandría",
  description:
    "Inicia sesión en la Biblioteca de Alejandría para acceder al catálogo, gestionar préstamos y más.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white/50 md:bg-brand-bg flex relative items-center justify-center w-full">
      <div className="min-w-full md:min-w-xl md:mx-4 md:rounded-2xl mx-auto md:bg-white/50 md:shadow-xl/25">

        {/* ── Formulario ── */}
        <main className="flex-2 px-4 md:px-10 py-10">
          <LoginForm />
        </main>

      </div>
    </div>
  );
}
