'use client';

import { motion } from 'framer-motion';
import { Hammer, ShoppingCart, BarChart3, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 backdrop-blur-md bg-background/80 sticky top-0 z-50 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Hammer className="w-6 h-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">GrupoJenta</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Características</Link>
          <Link href="#solutions" className="hover:text-primary transition-colors">Soluciones</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link>
        </div>
        <div>
          <Link 
            href="/login" 
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 overflow-hidden relative">
        {/* Background blobs for "Wow" effect */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            El futuro de las ferreterías en Colombia
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Gestiona tu ferretería con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">elegancia y precisión</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            Inventario, punto de venta y reportes diseñados para ser suaves con tu vista y potentes para tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition-transform shadow-xl shadow-primary/20 flex items-center gap-2">
              Comenzar ahora <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-white border border-border px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-colors shadow-sm">
              Ver Demo
            </button>
          </div>
        </motion.div>

        {/* Feature Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
        >
          <div className="p-8 rounded-3xl bg-white border border-border/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Inventario Inteligente</h3>
            <p className="text-muted-foreground">Control total de stock con alertas automáticas y gestión de variantes.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white border border-border/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
            <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">POS de Alta Velocidad</h3>
            <p className="text-muted-foreground">Ventas rápidas con soporte para lectores de barras e impresoras térmicas.</p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-border/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group">
            <div className="bg-orange-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Reportes Claros</h3>
            <p className="text-muted-foreground">Visualiza tu crecimiento con gráficas intuitivas y datos en tiempo real.</p>
          </div>
        </motion.div>
      </section>

      <footer className="border-t py-12 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-primary" />
            <span className="font-bold">GrupoJenta</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 GrupoJenta. Hecho para las ferreterías de Colombia.</p>
          <div className="flex gap-6 text-sm text-muted-foreground font-medium">
            <Link href="#" className="hover:text-primary transition-colors">Términos</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
