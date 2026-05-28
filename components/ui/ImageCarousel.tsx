"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  libroTitulo: string | null;
}

export default function ImageCarousel({ images, libroTitulo }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!hasMultipleImages) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleImages, goToPrev, goToNext]);

  if (images.length === 0) {
    return (
      <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
        <div className="relative w-full max-w-sm aspect-[3/4] bg-white shadow-xl shadow-brand-primary/5 rounded-sm overflow-hidden">
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
          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
      <div className="relative w-full max-w-sm">
        {/* Main image */}
        <div className="relative aspect-[3/4] bg-white shadow-xl shadow-brand-primary/5 rounded-sm overflow-hidden group">
          <Image
            src={images[currentIndex]}
            alt={libroTitulo ? `${libroTitulo} - Imagen ${currentIndex + 1}` : `Imagen ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority
          />
          
          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-sm" />
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {images.map((url, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden cursor-pointer transition-all ${
                  index === currentIndex
                    ? "ring-2 ring-brand-primary shadow-md"
                    : "ring-1 ring-brand-accent/20 opacity-60 hover:opacity-100"
                }`}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <Image
                  src={url}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
