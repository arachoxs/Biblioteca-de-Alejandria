"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  children: ReactNode;
  duration?: number;
  onClose?: () => void;
}

const CHECK_CIRCLE_SVG = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const X_CIRCLE_SVG = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const ALERT_TRIANGLE_SVG = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const INFO_SVG = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const X_BUTTON_SVG = (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const VARIANTS = {
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: CHECK_CIRCLE_SVG,
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: X_CIRCLE_SVG,
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon: ALERT_TRIANGLE_SVG,
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: INFO_SVG,
  },
};

const EXIT_DURATION_MS = 300;

export default function Alert({
  variant = "info",
  children,
  duration = 3000,
  onClose,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!duration || duration <= 0) return;

    const startTime = performance.now();
    let rafId: number;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, 1 - elapsed / duration);
      setProgress(remaining);

      if (remaining <= 0) {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose();
        }, EXIT_DURATION_MS);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [duration, onClose]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, EXIT_DURATION_MS);
  };

  if (!isMounted || !isVisible) return null;

  const { container, icon } = VARIANTS[variant];

  const alertElement = (
    <div
      className={`fixed top-4 left-0 right-0 mx-auto z-[9999] w-fit max-w-[90vw] md:max-w-md
        flex items-center gap-3 border px-4 py-3 rounded-lg text-sm shadow-lg
        ${container}
        ${isExiting ? "toast-slide-out" : "toast-slide-in"}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="flex-1 min-w-0 break-words font-medium">{children}</span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar notificación"
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded hover:bg-black/10"
      >
        {X_BUTTON_SVG}
      </button>
      {duration > 0 && !isExiting && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 rounded-b-lg"
          style={{ width: `${progress * 100}%` }}
        />
      )}
    </div>
  );

  const portalRoot = typeof document !== "undefined" ? document.body : null;
  if (!portalRoot) return null;

  return createPortal(alertElement, portalRoot);
}