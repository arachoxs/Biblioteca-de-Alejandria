import PasswordRecoveryForm from "./PasswordRecoveryForm";

export const metadata = {
  title: "Recuperar Contraseña — Biblioteca de Alejandría",
  description:
    "Restablece tu contraseña siguiendo los pasos de verificación por correo electrónico.",
};

export default function PasswordRecoveryPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center w-full relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(94,80,63,0.03) 60px, rgba(94,80,63,0.03) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(94,80,63,0.03) 60px, rgba(94,80,63,0.03) 61px)
          `,
        }}
      />

      <main className="relative z-[1] px-4 py-12 w-full">
        <PasswordRecoveryForm />
      </main>
    </div>
  );
}
