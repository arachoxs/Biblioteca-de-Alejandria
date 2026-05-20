"use client";

import Image from "next/image";

interface BookImageProps {
  coverImage: string | null | undefined;
  libroTitulo: string | null;
}

export default function BookImage({ coverImage, libroTitulo }: BookImageProps) {
  return (
    <div className="flex justify-center lg:sticky lg:top-24 lg:self-start">
      <div className="relative w-full max-w-sm aspect-[3/4] bg-white shadow-xl shadow-brand-primary/5 rounded-sm overflow-hidden group">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={libroTitulo || "Portada del libro"}
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
  );
}