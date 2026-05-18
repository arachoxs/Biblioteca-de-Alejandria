import Footer from "@/components/Footer";
import Carousel from "@/components/Carousel";
import NewsGrid from "@/components/ui/NewsGrid";
import PreferenciasLiterariasSection from "@/components/profile/PreferenciasLiterariasSection";
import { getNoticiasWithLibroCompleto } from "@/models/noticiaModel";
import { getCurrentUser, getCurrentUserRole } from "@/models/authModel";
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

export default async function Home() {
  const [user, role] = await Promise.all([
    getCurrentUser(),
    getCurrentUserRole(),
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

  const carouselItems = newsData.data
    .filter((n) => n.imagenes && n.imagenes.length > 0)
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      imagenes: n.imagenes,
      libro_titulo: n.libro_titulo || "",
      precio: n.precio,
    }));

  const displayItems =
    carouselItems.length > 0
      ? carouselItems
      : MOCK_CAROUSEL_IMAGES.map((url, index) => ({
          id: `mock-${index}`,
          imagenes: [url],
          libro_titulo: MOCK_CAROUSEL_TITLES[index],
          precio: 0,
        }));

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <main className="flex-1">
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
      </main>

      <Footer />
    </div>
  );
}
