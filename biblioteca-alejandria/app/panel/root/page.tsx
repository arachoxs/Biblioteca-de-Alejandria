export const metadata = {
    title: "Panel Root — Biblioteca de Alejandría",
    description: "Panel de administración del superusuario Root de la Biblioteca de Alejandría.",
};

export default function PanelRootPage() {
    return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
            <div className="text-center space-y-4">
                {/* Ícono distintivo */}
                <div className="w-20 h-20 mx-auto border-2 border-brand-text rounded-full grid place-items-center">
                    <svg className="w-8 h-8 text-brand-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">
                    Panel Root
                </h1>
                <p className="text-brand-secondary text-sm max-w-md mx-auto leading-relaxed">
                    Bienvenido, superusuario. Este panel está en construcción.
                </p>
                <div className="w-16 h-0.5 bg-brand-text mx-auto rounded-full" />
            </div>
        </div>
    );
}
