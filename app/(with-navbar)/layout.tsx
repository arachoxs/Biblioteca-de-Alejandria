import Navbar from "@/components/Navbar";
import ChatBot from "@/components/chatBot/ChatBot";
import { getCurrentUser, VISITANTE } from "@/models/authModel";
import { Rol } from "@/lib/types/auth";

export default async function NavbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = user
    ? (((user.app_metadata as Record<string, unknown>)?.role as Rol) ??
      VISITANTE)
    : VISITANTE;

  return (
    <>
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
      {role === Rol.CLIENTE && <ChatBot />}
    </>
  );
}
