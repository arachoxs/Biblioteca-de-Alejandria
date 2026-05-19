import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNoticiaDetail } from "./actions";
import BookDetailClient from "@/components/ui/BookDetailClient";

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const noticia = await getNoticiaDetail(id);

  return {
    title: noticia?.libro_titulo || "Detalle del libro",
    description: noticia?.libro_titulo
      ? `Ver detalles de ${noticia.libro_titulo} - Biblioteca de Alejandría`
      : "Detalle del libro",
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const noticia = await getNoticiaDetail(id);

  if (!noticia) {
    notFound();
  }

  return <BookDetailClient noticia={noticia} />;
}