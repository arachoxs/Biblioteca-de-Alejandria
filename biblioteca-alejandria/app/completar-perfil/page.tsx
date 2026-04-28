import CompletarPerfilAdmin from "./CompletarPerfilAdmin";

export const metadata = {
  title: "Completar Perfil | Biblioteca de Alejandría",
  description:
    "Completa tu información personal y establece tu contraseña definitiva para acceder al panel de administración.",
};

export default function CompletarPerfilPage() {
  return (
    <>
      <main className="min-h-screen flex items-center justify-center bg-brand-bg px-4 py-10">
        <div className="w-full max-w-2xl">
          <CompletarPerfilAdmin />
        </div>
      </main>
    </>
  );
}
