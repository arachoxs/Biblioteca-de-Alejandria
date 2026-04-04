"use client";

import type React from "react";
import { useMemo } from "react";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/validations/rules";

// ─── Tipos ──────────────────────────────────────────────────────────

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

// ─── Helper: validar requisitos usando las reglas reales ───────────

function getPasswordRequirements(password: string): PasswordRequirement[] {
  // Estas validaciones deben coincidir con passwordRule() en lib/validations/rules.ts
  return [
    {
      id: "length",
      label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "lowercase",
      label: "Una letra minúscula (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "uppercase",
      label: "Una letra mayúscula (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "special",
      label: "Un dígito o carácter especial",
      met: /[^\sa-zA-Z]/.test(password),
    },
    {
      id: "no-spaces",
      label: "Sin espacios en blanco",
      met: password.length > 0 && !/\s/.test(password),
    },
  ];
}

function getStrengthLevel(metCount: number, total: number): {
  level: number;
  label: string;
  color: string;
  bgColor: string;
} {
  const percentage = (metCount / total) * 100;

  if (percentage === 0) {
    return { level: 0, label: "", color: "text-gray-400", bgColor: "bg-gray-300" };
  }
  if (percentage <= 40) {
    return { level: 1, label: "Débil", color: "text-red-600", bgColor: "bg-red-500" };
  }
  if (percentage <= 60) {
    return { level: 2, label: "Media", color: "text-amber-600", bgColor: "bg-amber-500" };
  }
  if (percentage <= 80) {
    return { level: 3, label: "Buena", color: "text-blue-600", bgColor: "bg-blue-500" };
  }
  return { level: 4, label: "Excelente", color: "text-green-600", bgColor: "bg-green-500" };
}

// ─── Iconos ─────────────────────────────────────────────────────────

const CheckIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

// ─── Componente Principal ───────────────────────────────────────────

export default function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const requirements = useMemo(
    () => getPasswordRequirements(password),
    [password]
  );

  const metCount = requirements.filter((r) => r.met).length;
  const total = requirements.length;
  const strength = getStrengthLevel(metCount, total);
  const percentage = (metCount / total) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Barra de progreso */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full ${strength.bgColor} transition-all duration-500 ease-out transform origin-left`}
            style={{ 
              width: `${percentage}%`,
              animation: 'scaleX 0.5s ease-out'
            }}
            role="progressbar"
            aria-valuenow={metCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Fortaleza de la contraseña"
          />
        </div>
        {strength.label && (
          <p className={`text-xs font-semibold ${strength.color} transition-colors duration-300`}>
            {strength.label}
          </p>
        )}
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <ul className="space-y-2" aria-label="Requisitos de contraseña">
          {requirements.map((req, index) => (
            <li
              key={req.id}
              className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                req.met ? "text-green-700 font-medium" : "text-gray-500"
              }`}
              style={{
                animation: req.met ? `slideIn 0.3s ease-out ${index * 0.05}s backwards` : 'none'
              }}
            >
              {req.met ? (
                <CheckIcon className="size-4 flex-shrink-0 animate-[checkPop_0.3s_ease-out]" />
              ) : (
                <span
                  className="size-4 flex-shrink-0 rounded-full border-2 border-current opacity-40"
                  aria-hidden="true"
                />
              )}
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        @keyframes scaleX {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes checkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
