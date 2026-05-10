import PasswordRecoveryForm from "./PasswordRecoveryForm";
import Image from "next/image";

export const metadata = {
  title: "Recuperar Contraseña — Biblioteca de Alejandría",
  description:
    "Restablece tu contraseña siguiendo los pasos de verificación por correo electrónico.",
};

export default function PasswordRecoveryPage() {
  return (
    <div className="min-h-screen bg-white/50 md:bg-brand-bg flex relative items-center justify-center w-full">
      <div className="min-w-full md:min-w-2xl md:max-w-2xl md:mx-4 md:rounded-2xl mx-auto md:bg-white/50 md:shadow-xl/25">

        <main className="px-4 w-full md:px-10 py-10">
          <PasswordRecoveryForm />
        </main>

      </div>
    </div>
  );
}
