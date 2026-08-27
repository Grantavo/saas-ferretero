'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  LogOut,
  Shield,
  LayoutDashboard,
  Building2,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';

const adminNav = [
  { name: 'Panel Principal', href: '/admin', icon: LayoutDashboard },
  { name: 'Negocios', href: '/admin/tenants', icon: Building2 },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Guard de acceso client-side (defense in depth; el proxy ya bloquea el
  // render del lado servidor, pero nunca confiamos en una sola capa).
  useEffect(() => {
    let cancelled = false;

    async function checkSuperAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: isSuperAdmin, error } = await supabase.rpc('is_super_admin');
      if (cancelled) return;

      if (error || !isSuperAdmin) {
        router.replace('/dashboard');
        return;
      }

      setAuthChecked(true);
    }

    checkSuperAdmin();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sidebarContent = (collapsed: boolean, showToggle: boolean) => (
    <>
      <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-slate-100`}>
        <div className={`flex items-center ${collapsed ? 'justify-between gap-1' : 'gap-3'}`}>
          <div className={`${collapsed ? 'w-9 h-9' : 'w-10 h-10'} bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0`}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-slate-800 font-black tracking-tight text-sm whitespace-nowrap">GRUPOJENTA</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          )}
          {showToggle && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {adminNav.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center rounded-2xl font-bold text-sm transition-all",
                collapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3.5',
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {isActive && !collapsed && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          title={collapsed ? 'Cerrar Sesión' : undefined}
          className={`w-full flex items-center rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all ${
            collapsed ? 'justify-center py-3.5' : 'gap-3 px-4 py-3.5'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && 'Cerrar Sesión'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {!authChecked && (
        <div className="fixed inset-0 z-[100] bg-[#f8f9ff] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Shield className="w-10 h-10 text-violet-500 animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verificando acceso...</p>
          </div>
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-100 flex-col shadow-sm z-10 transition-all duration-300`}>
        {sidebarContent(sidebarCollapsed, true)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="overflow-hidden flex-1">
                  <h1 className="text-slate-800 font-black tracking-tight text-sm whitespace-nowrap">GRUPOJENTA</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Super Admin</p>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {sidebarContent(false, false)}
          </motion.aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Panel de Administración</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <span className="hidden sm:inline text-xs font-bold text-slate-600">Admin</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-500/20 shrink-0">
                G
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit', fontWeight: 600, fontSize: '14px' },
        }}
      />
    </div>
  );
}
