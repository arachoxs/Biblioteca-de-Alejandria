"use client";

import { useState } from "react";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { Rol } from "@/lib/types/auth";

function useQuantity(initial: number = 1, max: number = 3) {
  const [quantity, setQuantity] = useState(initial);

  const increment = () => {
    if (quantity < max) setQuantity((q) => q + 1);
  };

  const decrement = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  return { quantity, increment, decrement };
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