import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Galerie Antiquités — Art & Objets d'Exception",
    template: "%s | Galerie Antiquités",
  },
  description:
    "Découvrez des antiquités et œuvres d'art d'exception, soigneusement sélectionnées par nos experts. Achat sécurisé, fonds en séquestre.",
  keywords: ["antiquités", "art", "mobilier ancien", "tableaux", "sculptures", "objets d'art"],
  openGraph: {
    title: "Galerie Antiquités",
    description: "Art & Objets d'Exception",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${lora.variable} ${inter.variable}`}>
      <body>
        <SessionProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
