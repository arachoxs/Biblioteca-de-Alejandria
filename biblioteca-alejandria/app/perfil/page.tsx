import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentUserRole } from "@/models/authModel";
import { fetchProfile } from "@/services/profile/profileService";
import { Rol } from "@/lib/types/auth";
import PerfilClient from "./PerfilClient";
import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Mi Perfil — Biblioteca de Alejandría",
    description: "Visualiza y actualiza tu información personal en la Biblioteca de Alejandría.",
};

export default async function PerfilPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const [profileData, role] = await Promise.all([
        fetchProfile(user.id),
        getCurrentUserRole(),
    ]);

    if (!profileData) {
        redirect("/login");
    }

    const isCliente = role === Rol.CLIENTE;

    return (
        <div className="min-h-screen bg-brand-bg flex flex-col">
            <Navbar />

            <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <PerfilClient
                    profileData={profileData}
                    isCliente={isCliente}
                />
            </main>
        </div>
    );
}
