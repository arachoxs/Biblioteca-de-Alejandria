"use client";

import BackLink from "@/components/ui/BackLink";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import { Rol } from "@/lib/types/auth";
import { useQuantity, useCartValidation, useBibliographicData } from "./BookDetailClient.hooks";
import BookImage from "./BookImage";
import BookHeader from "./BookHeader";
import QuantityControls from "./QuantityControls";
import ARButton from "./ARButton";
import BookSynopsis from "./BookSynopsis";
import BookSpecifications from "./BookSpecifications";
import MobileCartBar from "./MobileCartBar";

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

export default function BookDetailClient({ noticia, userRole }: BookDetailClientProps) {
  const { quantity, increment, decrement } = useQuantity();
  const { isCartAvailable, tooltip: cartTooltip } = useCartValidation(userRole, noticia.stock_disponible);
  const bibliographicData = useBibliographicData(noticia);

  const formattedPrice = formatPrice(noticia.precio);
  const coverImage = noticia.imagenes?.[0];

  return (
    <div className="min-h-screen bg-brand-bg pb-24 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 md:px-16 py-8 md:py-12">
        <BackLink href="/" label="Volver al catálogo" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <BookImage coverImage={coverImage} libroTitulo={noticia.libro_titulo} />

          <div className="flex flex-col">
            <BookHeader
              autorNombre={noticia.autor_nombre}
              libroTitulo={noticia.libro_titulo}
              formattedPrice={formattedPrice}
              estado={noticia.estado}
            />

            <QuantityControls
              quantity={quantity}
              increment={increment}
              decrement={decrement}
              isCartAvailable={isCartAvailable}
              cartTooltip={cartTooltip}
              stockDisponible={noticia.stock_disponible}
            />

            <ARButton />

            <BookSynopsis sinopsis={noticia.sinopsis} />

            <BookSpecifications bibliographicData={bibliographicData} />
          </div>
        </div>
      </main>

      <MobileCartBar isCartAvailable={isCartAvailable} cartTooltip={cartTooltip} />
    </div>
  );
}