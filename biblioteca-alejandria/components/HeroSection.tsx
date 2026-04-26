export default function HeroSection() {
  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="h-px w-12 bg-brand-accent/40" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-brand-accent font-medium">
            Novedades
          </span>
          <div className="h-px w-12 bg-brand-accent/40" />
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-brand-text tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
          Los mejores títulos
          <span className="block text-brand-primary">te esperan</span>
        </h1>

        <p className="text-brand-secondary text-lg md:text-xl max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-150">
          Explora nuestra colección de libros cuidadosamente seleccionada para los amantes de la lectura.
        </p>
      </div>
    </section>
  );
}