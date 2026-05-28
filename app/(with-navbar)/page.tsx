import Image from "next/image";
import Footer from "@/components/Footer";
import NewsGrid from "@/components/ui/NewsGrid";
import PreferenciasLiterariasSection from "@/components/profile/PreferenciasLiterariasSection";
import SearchSection from "./SearchSection";
import { getNoticiasWithLibroCompleto } from "@/models/noticiaModel";
import { getCurrentUser, getCurrentUserRole } from "@/models/authModel";
import { buscarNoticiasAction } from "@/app/actions/buscarAction";
import { Rol } from "@/lib/types/auth";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";

const BANNER_URL =
  "https://aaadijmkflfckmoluiex.supabase.co/storage/v1/object/public/imagenes-noticias/banners/banner.jpg";

type SearchParams = Promise<Record<string, string>>;

function hasActiveFilters(searchParams: Record<string, string>): boolean {
  return !!(
    searchParams.q ||
    searchParams.autor ||
    searchParams.categoria ||
    searchParams.idioma ||
    searchParams.editorial ||
    searchParams.ano_publicacion ||
    searchParams.precioMin ||
    searchParams.precioMax ||
    searchParams.estado
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [user, role, currentSearchParams] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
    searchParams,
  ]);

  const needsOnboarding =
    role === Rol.CLIENTE &&
    user?.user_metadata?.preferences_onboarding_complete !== true;

  let newsData: Paginated<NoticiaWithLibroCompleto> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  };

  try {
    newsData = await getNoticiasWithLibroCompleto(1, 20);
  } catch (error) {
    console.error("[Home] Error fetching news:", error);
  }

  const filtersActive = hasActiveFilters(currentSearchParams);

  const results = filtersActive
    ? await buscarNoticiasAction(new URLSearchParams(currentSearchParams))
    : null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <main className="flex-1">
        {filtersActive ? (
          <SearchSection results={results!} isAuthenticated={user !== null} />
        ) : (
          <>
            <section className="max-w-6xl mx-auto px-4 pt-8 pb-12">
              <div className="relative w-full aspect-video sm:aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden">
                <Image
                  src={BANNER_URL}
                  alt="Banner"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 pb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-brand-accent/20" />
                <h2 className="font-display text-xl font-semibold text-brand-text tracking-tight">
                  Novedades
                </h2>
                <div className="h-px flex-1 bg-brand-accent/20" />
              </div>
              <NewsGrid initialNews={newsData.data} isAuthenticated={user !== null} />
            </section>

            {needsOnboarding && (
              <section className="max-w-6xl mx-auto px-4 pb-16">
                <PreferenciasLiterariasSection isOnboarding />
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
