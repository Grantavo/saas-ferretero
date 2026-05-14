import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/providers/UserContext";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GrupoJenta | SaaS Ferretero",
  description: "La plataforma de gestión para ferreterías más avanzada de Colombia",
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
          <main className="relative flex min-h-screen flex-col">
            {children}
            <Toaster position="top-right" richColors />
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
