export const metadata = {
    title: "Panel Cliente — Biblioteca de Alejandría",
    description: "Panel del cliente registrado en la Biblioteca de Alejandría.",
};

export default function PanelClientePage() {
    return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-4">
                {/* Ícono distintivo */}
                <div className="w-20 h-20 mx-auto border-2 border-brand-accent rounded-full grid place-items-center">
                    <svg className="w-8 h-8 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-secondary tracking-tight">
                    Panel Cliente
                </h1>
                <p className="text-brand-secondary text-sm max-w-md mx-auto leading-relaxed">
                    Bienvenido. Este panel está en construcción.
                </p>
                <div className="w-16 h-0.5 bg-brand-accent mx-auto rounded-full" />
            </div>
        </div>
    );
}
