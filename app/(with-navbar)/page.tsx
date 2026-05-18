import Footer from "@/components/Footer";
import Carousel from "@/components/Carousel";
import NewsGrid from "@/components/ui/NewsGrid";
import PreferenciasLiterariasSection from "@/components/profile/PreferenciasLiterariasSection";
import SearchSection from "./SearchSection";
import { getNoticiasWithLibroCompleto } from "@/models/noticiaModel";
import { getCurrentUser, getCurrentUserRole } from "@/models/authModel";
import { buscarNoticiasAction } from "@/app/actions/buscarAction";
import { Rol } from "@/lib/types/auth";
import type { NoticiaWithLibroCompleto } from "@/lib/types/noticia";
import type { Paginated } from "@/lib/types/common";

const MOCK_CAROUSEL_IMAGES = [
  "https://i.imgur.com/nTxt9Xk.jpeg",
  "https://i.imgur.com/s7XJRQ9.jpeg",
  "https://i.imgur.com/QVysiPp.jpeg",
  "https://i.imgur.com/9sLopgG.jpeg",
  "https://i.imgur.com/Ozkzjau.jpeg",
];

const MOCK_CAROUSEL_TITLES = [
  "Nuevas Lecturas",
  "Recomendaciones",
  "Lo Más Vendido",
  "Próximamente",
  "Edición Especial",
];

type SearchParams = Promise<Record<string, string>>;

interface CarouselItem {
  id: string;
  imagenes: string[] | null;
  libro_titulo: string;
  precio: number;
}

function buildCarouselItems(newsData: Paginated<NoticiaWithLibroCompleto>): CarouselItem[] {
  const carouselItems = newsData.data
    .filter((n) => n.imagenes && n.imagenes.length > 0)
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      imagenes: n.imagenes,
      libro_titulo: n.libro_titulo || "",
      precio: n.precio,
    }));

  if (carouselItems.length > 0) {
    return carouselItems;
  }

  return MOCK_CAROUSEL_IMAGES.map((url, index) => ({
    id: `mock-${index}`,
    imagenes: [url],
    libro_titulo: MOCK_CAROUSEL_TITLES[index],
    precio: 0,
  }));
}

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

  const displayItems = buildCarouselItems(newsData);
  const filtersActive = hasActiveFilters(currentSearchParams);

  const results = filtersActive
    ? await buscarNoticiasAction(new URLSearchParams(currentSearchParams))
    : null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <main className="flex-1">
        {filtersActive ? (
          <SearchSection results={results!} />
        ) : (
          <>
            <section className="max-w-6xl mx-auto px-4 pt-8 pb-12">
              <Carousel items={displayItems} />
            </section>

            <section className="max-w-6xl mx-auto px-4 pb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-brand-accent/20" />
                <h2 className="font-display text-xl font-semibold text-brand-text tracking-tight">
                  Novedades
                </h2>
                <div className="h-px flex-1 bg-brand-accent/20" />
              </div>
              <NewsGrid initialNews={newsData.data} />
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
