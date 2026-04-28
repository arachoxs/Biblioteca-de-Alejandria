import Navbar from "@/components/Navbar";

export default function NavbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
