import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=%2Fcheckout");
  }

  const role = user.app_metadata?.role as string | undefined;

  return (
    <div className="min-h-screen bg-brand-bg/60">
      <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-brand-accent mb-3">
            <span>Carrito</span>
            <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-brand-primary font-medium">Finalizar compra</span>
          </div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-brand-text tracking-tight">
            Finalizar Compra
          </h1>
          <p className="text-brand-secondary/80 mt-1.5 text-[0.95rem]">
            {role === "CLIENTE"
              ? "Revisa los libros que has reservado antes de continuar"
              : "Inicia sesión como cliente para acceder al proceso de compra"}
          </p>
        </header>

        {role !== "CLIENTE" ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-accent/10 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796l-3.448 4.138m0 0a3.736 3.736 0 00-.88 1.388 3.765 3.765 0 000 2.528m.88-3.916l-4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652 9.027 9.027 0 01-1.652 1.306m2.958-2.958l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0m9.424 0a9.027 9.027 0 011.306 1.652 9.014 9.014 0 010 9.424" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-brand-text mb-2">
                Acceso denegado
              </h2>
              <p className="text-brand-secondary text-sm leading-relaxed">
                Solo los clientes pueden acceder al proceso de compra.
                {role === "ADMINISTRADOR" || role === "ROOT"
                  ? " Los administradores no pueden realizar compras."
                  : " Inicia sesión con una cuenta de cliente para continuar."}
              </p>
            </div>
          </div>
        ) : (
          <CheckoutClient />
        )}
      </div>
    </div>
  );
}
