import type { Metadata } from "next";
import { geistSans, geistMono, cormorantGaramond } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biblioteca de Alejandria",
  description:
    "Una plataforma para gestionar tu biblioteca personal, con funcionalidades de reserva, préstamo y compra de libros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} min-h-screen flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
