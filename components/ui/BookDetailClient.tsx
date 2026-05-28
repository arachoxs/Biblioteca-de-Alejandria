"use client";

import { useState, useEffect, useCallback } from "react";
import BackLink from "@/components/ui/BackLink";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { Rol } from "@/lib/types/auth";
import { useQuantity, useCartValidation, useBibliographicData } from "./BookDetailClient.hooks";
import { addToCart } from "@/app/(with-navbar)/noticia/[id]/actions";
import type { ReservaActionResponse } from "@/lib/types/reserva";
import ImageCarousel from "./ImageCarousel";
import BookHeader from "./BookHeader";
import QuantityControls from "./QuantityControls";
import ARButton from "./ARButton";
import BookSynopsis from "./BookSynopsis";
import BookSpecifications from "./BookSpecifications";
import MobileCartBar from "./MobileCartBar";
import { CheckCircle, AlertCircle } from "lucide-react";

interface BookDetailClientProps {
  noticia: NoticiaWithLibroCompleto;
  userRole: Rol | null;
}

interface FeedbackState {
  type: "success" | "error";
  message: string;
}

function formatPrice(precio: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(precio);
}

export default function BookDetailClient({ noticia, userRole }: BookDetailClientProps) {
  const { quantity, increment, decrement, max } = useQuantity(1, noticia.stock_disponible);
  const { isCartAvailable, tooltip: cartTooltip } = useCartValidation(userRole, noticia.stock_disponible);
  const bibliographicData = useBibliographicData(noticia);

  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleAddToCart = useCallback(async () => {
    if (!noticia.id_libro) return;
    setIsAdding(true);
    setFeedback(null);
    try {
      const result: ReservaActionResponse = await addToCart(noticia.id_libro, quantity);
      if (result.success) {
        setFeedback({ type: "success", message: result.message ?? "Agregado al carrito" });
      } else {
        setFeedback({ type: "error", message: result.message ?? "Error al agregar" });
      }
    } catch {
      setFeedback({ type: "error", message: "Ocurrió un error inesperado" });
    } finally {
      setIsAdding(false);
    }
  }, [noticia.id_libro, quantity]);

  const formattedPrice = formatPrice(noticia.precio);
  const images = (noticia.imagenes as string[]) ?? [];

  return (
    <div className="min-h-screen bg-brand-bg pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-12">
        <BackLink href="/" label="Volver al catálogo" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:100ms] fill-mode-both">
            <ImageCarousel images={images} libroTitulo={noticia.libro_titulo} />
          </div>

          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:250ms] fill-mode-both">
            <BookHeader
              autorNombre={noticia.autor_nombre}
              libroTitulo={noticia.libro_titulo}
              formattedPrice={formattedPrice}
              estado={noticia.estado}
            />

            <QuantityControls
              quantity={quantity}
              maxQuantity={max}
              increment={increment}
              decrement={decrement}
              isCartAvailable={isCartAvailable && !isAdding}
              cartTooltip={cartTooltip}
              stockDisponible={noticia.stock_disponible}
              onAddToCart={handleAddToCart}
              isAdding={isAdding}
            />

            <ARButton />

            <BookSynopsis sinopsis={noticia.sinopsis} />

            <BookSpecifications bibliographicData={bibliographicData} />
          </div>
        </div>
      </main>

      <MobileCartBar
        isCartAvailable={isCartAvailable && !isAdding}
        cartTooltip={cartTooltip}
        onAddToCart={handleAddToCart}
        isAdding={isAdding}
      />

      {feedback && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] toast-slide-in flex items-center gap-3 px-5 py-3 rounded-sm shadow-lg max-w-md w-[calc(100%-2rem)] ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium leading-tight">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}