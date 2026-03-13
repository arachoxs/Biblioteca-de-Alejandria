export const metadata = {
    title: "Panel Administrador — Biblioteca de Alejandría",
    description: "Panel de administración para gestores de la Biblioteca de Alejandría.",
};

export default function PanelAdminPage() {
    return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-4">
                {/* Ícono distintivo */}
                <div className="w-20 h-20 mx-auto border-2 border-brand-primary rounded-full grid place-items-center">
                    <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight">
                    Panel Administrador
                </h1>
                <p className="text-brand-secondary text-sm max-w-md mx-auto leading-relaxed">
                    Bienvenido, administrador. Este panel está en construcción.
                </p>
                <div className="w-16 h-0.5 bg-brand-primary mx-auto rounded-full" />
            </div>
        </div>
    );
}
