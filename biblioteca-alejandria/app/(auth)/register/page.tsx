import RegistroForm from "./RegistroForm";
import Image from "next/image";

export const metadata = {
    title: "Crear cuenta — Biblioteca de Alejandría",
    description: "Regístrate en la Biblioteca de Alejandría para acceder al catálogo, gestionar préstamos y más.",
};

export default function Registro() {
    return (
        <div className="bg-brand-bg flex w-full">
            <div className="w-full min-h-screen lg:max-h-screen flex lg:flex-row flex-col mx-auto grainy-glass">

                {/* ── Banner lateral ── */}
                <header className="text-center flex flex-1 rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none flex-col items-center justify-center px-10 py-12 relative overflow-hidden">
                    {/* Fondo desenfocado */}
                    <div className="absolute h-full inset-0 bg-cover bg-center bg-[url(/libros_banner.jpeg)] blur-sm scale-110" />
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
                        Crear una cuenta
                    </h1>
                    <p className="relative z-10 text-sm md:text-base text-white/80 leading-relaxed max-w-xs mx-auto font-light">
                        Únete a la Biblioteca de Alejandría y accede al catálogo, préstamos y mucho más
                    </p>
                    <div className="relative z-10 mt-6 h-px w-16 bg-brand-accent mx-auto rounded-full" />
                </header>

                {/* ── Formulario ── */}
                <main className="flex-2 px-4 md:px-10 lg:px-30 bg-white/50 py-10 lg:h-full lg:overflow-hidden">
                    <RegistroForm />
                </main>

            </div>
        </div>
    );
}