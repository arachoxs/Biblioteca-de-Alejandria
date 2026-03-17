import LoginForm from "./LoginForm";
import Image from "next/image";

export const metadata = {
    title: "Iniciar Sesión — Biblioteca de Alejandría",
    description: "Inicia sesión en la Biblioteca de Alejandría para acceder al catálogo, gestionar préstamos y más.",
};

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center w-full">
            <div className="lg:max-w-10/12 md:mx-4 flex lg:flex-row flex-col w-full md:rounded-2xl mx-auto grainy-glass">

                {/* ── Banner lateral ── */}
                <header className="text-center flex flex-1 rounded-b-2xl md:rounded-2xl flex-col items-center justify-center px-10 py-12 relative overflow-hidden">
                    {/* Fondo desenfocado */}
                    <div className="absolute inset-0 bg-cover bg-center bg-[url(/libros_banner.jpeg)] blur-sm scale-110" />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/70" />

                    <div className="relative z-10 mb-5">
                        <Image
                            src="/logo-fondo-oscuro.png"
                            alt="Biblioteca de Alejandría"
                            width={80}
                            height={80}
                            className="mx-auto"
                        />
                    </div>
                    <h1
                        className="relative z-10 text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight leading-tight font-display"
                    >
                        Bienvenido de nuevo
                    </h1>
                    <p className="relative z-10 text-sm md:text-base text-white/80 leading-relaxed max-w-xs mx-auto font-light">
                        Ingresa tus credenciales para acceder al sistema de la Biblioteca de Alejandría
                    </p>
                    <div className="relative z-10 mt-6 h-px w-16 bg-brand-accent mx-auto rounded-full" />
                </header>

                {/* ── Formulario ── */}
                <main className="flex-2 px-4 md:px-10 py-10">
                    <LoginForm />
                </main>

            </div>
        </div>
    );
}
