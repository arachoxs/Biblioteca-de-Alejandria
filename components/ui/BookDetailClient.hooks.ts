"use client";

import { useState } from "react";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { Rol } from "@/lib/types/auth";
import { MAX_RESERVAS_MISMO_LIBRO } from "@/lib/validations/rules";

function useQuantity(
  initial: number = 1,
  stockDisponible: number | null | undefined,
) {
  const max = Math.min(
    MAX_RESERVAS_MISMO_LIBRO,
    stockDisponible ?? MAX_RESERVAS_MISMO_LIBRO,
  );

  const [quantity, setQuantity] = useState(
    Math.min(initial, Math.max(1, max)),
  );

  const increment = () => {
    setQuantity((q) => Math.min(q + 1, max));
  };

  const decrement = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  return { quantity, increment, decrement, max };
}

function useCartValidation(userRole: Rol | null, stockAvailable: number | null | undefined) {
  const stockValid = (stockAvailable ?? 0) > 0;
  const isCartAvailable = userRole === Rol.CLIENTE && stockValid;

  const getTooltip = (): string => {
    if (!userRole) return "Inicia sesión para agregar al carrito";
    if (userRole !== Rol.CLIENTE) return "Esta opción está deshabilitada para administradores";
    if (!stockValid) return "Sin stock disponible";
    return "";
  };

  return { isCartAvailable, tooltip: getTooltip() };
}

function useBibliographicData(noticia: NoticiaWithLibroCompleto) {
  const bibliographicData = [
    { label: "ISBN", value: noticia.isbn },
    { label: "Páginas", value: noticia.paginas?.toString() },
    { label: "Idioma", value: noticia.idioma },
    { label: "Editorial", value: noticia.editorial },
    { label: "Año de publicación", value: noticia.ano_publicacion?.toString() },
    { label: "Categoría", value: noticia.categoria_nombre },
  ].filter((item) => item.value);

  return bibliographicData;
}

export { useQuantity, useCartValidation, useBibliographicData };