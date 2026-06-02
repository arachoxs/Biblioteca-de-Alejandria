"use client";

import { useRef, useEffect } from "react";

interface UseChatModalOptions {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(panel: HTMLElement, e: KeyboardEvent) {
  const els = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (els.length === 0) return;
  const first = els[0];
  const last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function useChatModal({
  isOpen,
  isClosing,
  onClose,
}: UseChatModalOptions) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape + Focus trap
  useEffect(() => {
    if (!isOpen || isClosing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) trapFocus(panelRef.current, e);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isClosing, onClose]);

  // Cleanup timer on unmount
  useEffect(() => {
    const t = timerRef.current;
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  return { panelRef, inputRef, timerRef };
}
