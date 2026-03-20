"use client";

import Modal from "@/components/ui/Modal";

export default function ChangePasswordModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Contraseña">
            <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-accent/15 rounded-full flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>

                <div className="w-10 h-0.5 bg-brand-accent/50 rounded-full mb-4" />

                <p className="text-sm text-brand-secondary font-normal leading-relaxed mb-7 max-w-[280px]">
                    <strong>Work in progress.</strong> Esta funcionalidad está siendo desarrollada y estará disponible próximamente en una futura actualización.
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center h-11 px-8 rounded-lg bg-brand-primary text-brand-bg text-sm font-medium uppercase tracking-wider hover:bg-brand-text transition-all cursor-pointer w-full"
                >
                    Entendido
                </button>
            </div>
        </Modal>
    );
}
