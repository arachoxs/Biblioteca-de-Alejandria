"use client";

import { useState } from "react";
import PreferenciasLiterariasSection from "./PreferenciasLiterariasSection";
import FinancialModal from "./FinancialModal";

// ─── Componente principal ──────────────────────────────────────────

export default function ClientModules() {
    const [financialModalOpen, setFinancialModalOpen] = useState(false);

    return (
        <>
            {/* Tarjetas de módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                {/* Preferencias Literarias */}
                <PreferenciasLiterariasSection />

                {/* Gestión Financiera */}
                <button
                    type="button"
                    onClick={() => setFinancialModalOpen(true)}
                    className="text-left bg-white border border-brand-accent/25 rounded-lg p-6 shadow-[0_1px_3px_rgba(10,9,8,0.04)] transition-all hover:border-brand-primary hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
                >
                    <div className="w-12 h-12 rounded-full bg-brand-accent/12 grid place-items-center mb-3">
                        <svg className="w-6 h-6 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <path d="M1 10h22" />
                        </svg>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-brand-primary mb-1.5 tracking-wide group-hover:underline underline-offset-2">
                        Gestión Financiera
                    </h3>
                    <p className="text-sm text-brand-secondary font-light leading-relaxed">
                        Administra tus tarjetas, consulta saldos y realiza recargas.
                    </p>
                </button>
            </div>

            {/* Modal de Gestión Financiera */}
            <FinancialModal
                isOpen={financialModalOpen}
                onClose={() => setFinancialModalOpen(false)}
            />
        </>
    );
}
