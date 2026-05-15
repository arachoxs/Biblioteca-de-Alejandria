"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import PreferenciasLiterariasSection from "./PreferenciasLiterariasSection";

// ─── Componente principal ──────────────────────────────────────────

export default function ClientModules() {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");

    const handleOpenModal = (title: string) => {
        setModalTitle(title);
        setModalOpen(true);
    };

    return (
        <>
            {/* Tarjetas de módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                {/* Preferencias Literarias */}
                <PreferenciasLiterariasSection />

                {/* Gestión Financiera */}
                <button
                    type="button"
                    onClick={() => handleOpenModal("Gestión Financiera")}
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
                        Consulta tus multas pendientes, historial de pagos y detalles de transacciones.
                    </p>
                </button>
            </div>

            {/* ── Modal: Work in Progress ── */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
                <div className="text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-brand-accent/15 rounded-full flex items-center justify-center mb-5">
                        <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m14 7 3 3-3 3" />
                            <path d="M7 17l-3-3 3-3" />
                            <path d="M10 21l4-18" />
                        </svg>
                    </div>
                    
                    <div className="w-10 h-0.5 bg-brand-accent/50 rounded-full mb-4" />
                    
                    <p className="text-sm text-brand-secondary font-normal leading-relaxed mb-7 max-w-[280px]">
                        <strong>Work in progress.</strong> Esta funcionalidad está siendo desarrollada y estará disponible próximamente en una futura actualización.
                    </p>
                    
                    <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-brand-primary text-brand-bg text-sm font-medium uppercase tracking-wider hover:bg-brand-text transition-all cursor-pointer w-full"
                    >
                        Entendido
                    </button>
                </div>
            </Modal>
        </>
    );
}
