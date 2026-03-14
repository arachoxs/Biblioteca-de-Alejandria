import { HTMLAttributes, ReactNode } from "react";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "success" | "error" | "warning" | "info";
    className?: string;
    children: ReactNode;
}

export default function Alert({ variant = "info", className = "", children, ...props }: AlertProps) {
    const variants = {
        success: "bg-green-50 border-green-200 text-green-600",
        error: "bg-red-50 border-red-200 text-red-600",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-600",
        info: "bg-blue-50 border-blue-200 text-blue-600",
    };

    const baseStyles = "border px-4 py-3 rounded-lg text-sm";
    
    return (
        <div 
            className={`${baseStyles} absolute left-1/2 -translate-x-1/2  ${variants[variant]} ${className}`}
            role="alert"
            {...props}
        >
            {children}
        </div>
    );
}
