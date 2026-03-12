import RegistroForm from "./RegistroForm";

export default function Registro() {
    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center w-full">
            <div className="lg:max-w-9/12 md:mx-4 flex lg:flex-row flex-col w-full md:rounded-2xl mx-auto grainy-glass">

                <header className="text-center flex flex-1 rounded-b-2xl md:rounded-2xl flex-col items-center justify-center px-10 py-6 relative overflow-hidden">
                    {/* Imagen de fondo desenfocada */}
                    <div className="absolute inset-0 bg-cover bg-center bg-[url(/libros_banner.jpeg)] blur-sm scale-110" />
                    {/* Overlay oscuro para legibilidad del texto */}
                    <div className="absolute inset-0 bg-black-primary/60" />
                    <h1 className="relative z-10 text-4xl font-bold text-white mb-3 tracking-tight">
                        Crear una cuenta
                    </h1>
                    <p className="relative z-10 text-2xs md:text-lg text-white/85 leading-relaxed max-w-md mx-auto">
                        Crea una cuenta para poder acceder a todas las funcionalidades de la Biblioteca de Alejandría
                    </p>
                    <div className="relative z-10 mt-6 h-px bg-linear-to-r from-transparent via-brand-accent to-transparent" />
                </header>

                <main className="flex-2 px-4 md:px-10 py-6">
                    <RegistroForm />
                </main>

            </div>
        </div>
    );
}