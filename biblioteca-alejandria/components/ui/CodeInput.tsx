"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function CodeInput({ length = 6, value, onChange }: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = (index: number) => {
    inputsRef.current[index]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join("").slice(0, length);
    onChange(newValue);

    if (char && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, length - 1));
    }
  };

  return (
    <div className="flex gap-2.5 justify-center mb-6">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          placeholder="·"
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          className="w-12 h-14 text-center text-2xl font-bold text-brand-text
            border border-brand-accent/35 rounded bg-brand-bg outline-none
            transition-all duration-200
            focus:border-brand-primary focus:shadow-[0_0_0_3px_rgba(73,17,28,0.08)] font-display"
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  );
}
