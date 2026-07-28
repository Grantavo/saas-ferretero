import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/providers/UserContext";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GrupoJenta",
  description: "La plataforma de gestión de negocios.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "GrupoJenta",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#7C3AED",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <UserProvider>
          <ServiceWorkerRegister />
          <main className="relative flex min-h-screen flex-col">
            {children}
            <Toaster position="top-right" richColors />
          </main>
        </UserProvider>
      </body>
    </html>
  );
}