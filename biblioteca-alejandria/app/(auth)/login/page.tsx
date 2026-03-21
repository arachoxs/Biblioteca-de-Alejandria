import LoginForm from "./LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Iniciar Sesión — Biblioteca de Alejandría",
  description:
    "Inicia sesión en la Biblioteca de Alejandría para acceder al catálogo, gestionar préstamos y más.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex relative items-center justify-center w-full">
      <div className="lg:max-w-8/12 md:mx-4 flex lg:flex-row flex-col w-full md:rounded-2xl mx-auto grainy-glass">

        {/* ── Banner lateral ── */}
        <header className="text-center flex flex-1 rounded-b-2xl md:rounded-2xl flex-col items-center justify-center px-10 py-12 relative overflow-hidden">
          {/* Imagen de fondo desenfocada */}
          <div className="absolute inset-0 bg-cover bg-center bg-[url(/libros_banner.jpeg)] blur-sm scale-110" />
          {/* Overlay oscuro para legibilidad del texto */}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 mb-5">
            <Image
              src="/logo-fondo-oscuro.png"
              alt="Biblioteca de Alejandría"
              width={80}
              height={80}
              className="mx-auto drop-shadow-lg"
            />
          </div>
          <p className="relative z-10 text-4xl font-bold text-white mb-3 tracking-tight">
            Bienvenido de nuevo
          </p>
          <p className="relative z-10 text-2xs md:text-lg text-white/85 leading-relaxed max-w-md mx-auto">
            Ingresa tus credenciales para acceder al sistema de la Biblioteca de Alejandría
          </p>
          <div className="relative z-10 mt-6 h-px bg-linear-to-r from-transparent via-brand-accent to-transparent" />
        </header>

        {/* ── Formulario ── */}
        <main className="flex-2 px-4 md:px-10 py-10">
          <LoginForm />
        </main>

      </div>
    </div>
  );
}
