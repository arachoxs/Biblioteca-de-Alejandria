"use client";

import { useState } from "react";
import Image from "next/image";
import BackLink from "@/components/ui/BackLink";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { Rol } from "@/lib/types/auth";
import { ShoppingCart, Smartphone } from "lucide-react";

interface BookDetailClientProps {
  noticia: NoticiaWithLibroCompleto;
  userRole: Rol | null;
}

function formatPrice(precio: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(precio);
}

function capitalize(str: string | null | undefined): string | null {
  if (!str) return null;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function BookDetailClient({ noticia, userRole }: BookDetailClientProps) {
  const [quantity, setQuantity] = useState(1);

  const formattedPrice = formatPrice(noticia.precio);
  const coverImage = noticia.imagenes?.[0];

  const incrementQuantity = () => {
    if (quantity < 3) setQuantity((q) => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const bibliographicData = [
    { label: "ISBN", value: noticia.isbn },
    { label: "Páginas", value: noticia.paginas?.toString() },
    { label: "Idioma", value: noticia.idioma },
    { label: "Editorial", value: noticia.editorial },
    { label: "Año de publicación", value: noticia.ano_publicacion?.toString() },
    { label: "Categoría", value: noticia.categoria_nombre },
  ].filter((item) => item.value);

  const stockValid = (noticia.stock_disponible ?? 0) > 0;
  const isCartAvailable = userRole === Rol.CLIENTE && stockValid;

  const getCartTooltip = () => {
    if (!userRole) return "Inicia sesión para agregar al carrito";
    if (userRole !== Rol.CLIENTE) return "Esta opción está deshabilitada para administradores";
    if (!stockValid) return "Sin stock disponible";
    return "";
  };

  const cartTooltip = getCartTooltip();

  return (
    <div className="min-h-screen bg-brand-bg pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-12">
        <BackLink href="/" label="Volver al catálogo" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Column */}
          <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-white shadow-xl shadow-brand-primary/5 rounded-sm overflow-hidden group">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={noticia.libro_titulo || "Portada del libro"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-primary/5 to-brand-accent/10">
                  <svg
                    className="w-20 h-20 text-brand-accent/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-sm" />
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            {noticia.autor_nombre && (
              <p className="text-lg md:text-xl text-brand-secondary font-medium tracking-wide mb-2">
                {noticia.autor_nombre}
              </p>
            )}

            <h1 className="font-display text-3xl md:text-5xl text-brand-primary leading-tight mb-6">
              {noticia.libro_titulo || "Título no disponible"}
            </h1>

            <div className="flex items-center gap-4 mb-6 border-b border-brand-accent/20 pb-6">
              <span className="text-2xl md:text-3xl font-semibold text-brand-text">
                {formattedPrice}
              </span>
              {noticia.estado && (
                <>
                  <div className="h-5 w-px bg-brand-accent/40" />
                  <span className="inline-flex items-center px-3 py-1 bg-brand-bg rounded-sm text-xs uppercase tracking-widest text-brand-secondary border border-brand-accent/20">
                    {capitalize(noticia.estado)}
                  </span>
                </>
              )}
            </div>

            {/* Quantity + Stock Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center gap-0 rounded-sm border border-brand-accent/30 overflow-hidden">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="px-4 py-3 text-brand-secondary hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="flex-1 text-center font-semibold text-brand-text">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= 3}
                  className="px-4 py-3 text-brand-secondary hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <button
                disabled={!isCartAvailable}
                title={cartTooltip}
                className="flex-1 bg-brand-primary text-white py-4 px-8 rounded-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-sm disabled:bg-brand-accent/30 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                Agregar al carrito
              </button>
              {noticia.stock_disponible !== undefined && noticia.stock_disponible !== null && (
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-bg rounded-sm border border-brand-accent/20">
                  <span className="text-xs text-brand-secondary">Stock:</span>
                  <span className="text-sm font-semibold text-brand-text">
                    {noticia.stock_disponible} unidades
                  </span>
                </div>
              )}
            </div>

            {/* AR Button - Disabled */}
            <div className="mb-8 relative inline-block group">
              <button
                disabled
                className="w-full sm:w-auto bg-transparent border border-brand-accent/30 text-brand-secondary/50 py-4 px-8 rounded-sm flex items-center justify-center gap-2 font-semibold uppercase tracking-wider text-sm cursor-not-allowed opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                Ver en realidad aumentada
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-brand-text text-white text-xs rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Funcionalidad en desarrollo
              </div>
            </div>

            {/* Synopsis */}
            {noticia.sinopsis && (
              <div className="mb-8">
                <h3 className="font-display text-xl md:text-2xl text-brand-primary mb-4">
                  Descripción
                </h3>
                <p className="text-base md:text-lg text-brand-text/80 leading-relaxed">
                  {noticia.sinopsis}
                </p>
              </div>
            )}

            {/* Specifications */}
            <div className="border-t border-brand-accent/20 pt-8">
              <h3 className="font-display text-xl md:text-2xl text-brand-primary mb-6">
                Especificaciones
              </h3>
              <dl className="divide-y divide-brand-accent/20 border-b border-brand-accent/20">
                {bibliographicData.map(({ label, value }) => (
                  <div key={label} className="py-4 flex justify-between items-center group">
                    <dt className="text-xs font-semibold uppercase tracking-widest text-brand-secondary w-1/3">
                      {label}
                    </dt>
                    <dd className="text-base text-brand-text w-2/3 text-right group-hover:text-brand-primary transition-colors">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-brand-accent/20 p-4 pb-6 md:hidden z-50 shadow-lg">
        <button
          disabled={!isCartAvailable}
          title={cartTooltip}
          className="w-full bg-brand-primary text-white py-4 rounded-sm font-semibold uppercase tracking-wider text-sm hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2 disabled:bg-brand-accent/30 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}