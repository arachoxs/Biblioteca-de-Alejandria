import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNoticiaDetail } from "./actions";
import BookDetailClient from "@/components/ui/BookDetailClient";
import { createClient } from "@/lib/supabase/server";
import { Rol } from "@/lib/types/auth";

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
  const [noticia, supabase] = await Promise.all([
    getNoticiaDetail(id),
    createClient()
  ]);

  if (!noticia) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userRole = (user?.app_metadata as Record<string, unknown>)?.role as Rol | null;

  return <BookDetailClient noticia={noticia} userRole={userRole} />;
}