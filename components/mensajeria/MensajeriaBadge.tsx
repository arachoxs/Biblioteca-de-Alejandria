"use client";

import { useEffect, useState } from "react";
import { getContadorNoLeidosAction } from "@/app/actions/mensajeriaActions";

interface MensajeriaBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

export default function MensajeriaBadge({
  size = "md",
  className = "",
}: MensajeriaBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const result = await getContadorNoLeidosAction();
        setCount(result);
      } catch {
        setCount(0);
      }
    }

    fetchCount();

    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  const sizeClasses = size === "sm" 
    ? "min-w-[16px] h-[16px] text-[10px] px-1" 
    : "min-w-[20px] h-[20px] text-xs px-1.5";

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full bg-brand-primary text-white ${sizeClasses} ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
