import { useEffect, useState } from "react";

/**
 * Custom hook para debouncing de valores.
 * 
 * Retrasa la actualización de un valor hasta que haya pasado un tiempo
 * determinado sin cambios, útil para evitar múltiples requests mientras
 * el usuario escribe.
 * 
 * @param value - Valor a debounce
 * @param delay - Tiempo de retraso en milisegundos (default: 500ms)
 * @returns El valor debounced
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 700);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Hacer búsqueda con el valor debounced
 *     searchAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Establecer un timer para actualizar el valor después del delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timer si el valor cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
