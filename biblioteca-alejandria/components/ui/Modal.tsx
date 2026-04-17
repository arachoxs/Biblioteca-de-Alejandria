"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;
  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center max-h-screen justify-center p-2 py-10 md:py-2 bg-brand-text/50 backdrop-blur-sm animate-in fade-in duration-200 `}>
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-${maxWidth ? maxWidth : "md"} max-h-full overflow-hidden overflow-y-scroll animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-brand-primary/5`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-accent/10 bg-brand-bg">
          <h2
            id="modal-title"
            className="text-xl font-bold text-brand-primary font-display tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-brand-secondary/70 hover:bg-brand-bg hover:text-brand-primary cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            aria-label="Cerrar modal">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
