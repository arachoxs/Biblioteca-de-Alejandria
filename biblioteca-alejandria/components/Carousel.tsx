"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  id: string;
  imagenes: string[] | null;
  libro_titulo: string;
  precio: number;
  href?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
}

function CarouselIndicator({
  index,
  isActive,
  onClick,
}: {
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-2 h-2 rounded-full transition-all ${
        isActive ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
      }`}
      aria-label={`Ir a imagen ${index + 1}`}
    />
  );
}

function formatPrice(precio: number): string | null {
  if (precio <= 0) return null;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(precio);
}

function useSwipeHandlers({
  onSwipe,
  minTouchDistance,
}: {
  onSwipe: (direction: "next" | "prev") => void;
  minTouchDistance: number;
}) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minTouchDistance) onSwipe("next");
    if (distance < -minTouchDistance) onSwipe("prev");
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, minTouchDistance, onSwipe]);

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
}

export default function Carousel({ items, autoPlayInterval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalItems = items.length;
  const current = items[currentIndex];
  const formattedPrice = useMemo(() => formatPrice(current.precio), [current.precio]);
  const hasMultipleItems = totalItems > 1;
  const showPrice = current.precio > 0;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleSwipe = useCallback(
    (direction: "next" | "prev") => {
      if (direction === "next") {
        goToNext();
      } else {
        goToPrev();
      }
    },
    [goToNext, goToPrev]
  );

  const minTouchDistance = 50;

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeHandlers({
    onSwipe: handleSwipe,
    minTouchDistance,
  });

  useEffect(() => {
    if (isPaused || !hasMultipleItems) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPaused, hasMultipleItems, autoPlayInterval, goToNext]);

  if (totalItems === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] md:h-[450px] rounded-2xl overflow-hidden bg-brand-secondary/5 cursor-pointer select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0">
        {current.imagenes && current.imagenes.length > 0 ? (
          <Image
            src={current.imagenes[0]}
            alt={current.libro_titulo}
            fill
            className="object-cover transition-opacity duration-500"
            priority
          />
        ) : (
          <PlaceholderBackground />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <CarouselContent
        titulo={current.libro_titulo}
        formattedPrice={formattedPrice}
        showPrice={showPrice}
      />

      {hasMultipleItems && (
        <CarouselControls
          onPrev={goToPrev}
          onNext={goToNext}
          onDotClick={goToIndex}
          totalItems={totalItems}
          currentIndex={currentIndex}
        />
      )}
    </div>
  );
}

function PlaceholderBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 flex items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-brand-accent/20 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-brand-accent"
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
    </div>
  );
}

function CarouselContent({
  titulo,
  formattedPrice,
  showPrice,
}: {
  titulo: string;
  formattedPrice: string | null;
  showPrice: boolean;
}) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
      <div className="max-w-2xl">
        <span className="inline-block px-3 py-1 bg-brand-primary/90 text-white text-xs uppercase tracking-widest rounded-full mb-4">
          Novedad
        </span>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-3">
          {titulo}
        </h2>
        {formattedPrice && showPrice && (
          <p className="text-xl md:text-2xl text-white/90 font-display font-medium mb-6">
            {formattedPrice}
          </p>
        )}
        {showPrice && <DetailsButton />}
      </div>
    </div>
  );
}

function DetailsButton() {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-primary font-semibold rounded-lg hover:bg-brand-bg transition-colors cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      Ver detalles
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function CarouselControls({
  onPrev,
  onNext,
  onDotClick,
  totalItems,
  currentIndex,
}: {
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (index: number) => void;
  totalItems: number;
  currentIndex: number;
}) {
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all cursor-pointer"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all cursor-pointer"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 right-8 flex gap-2">
        {Array.from({ length: totalItems }).map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onDotClick(index);
            }}
            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              index === currentIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </>
  );
}