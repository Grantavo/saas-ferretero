'use client';

import { useState } from 'react';
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
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      {/* Admin Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-100 flex flex-col shadow-sm z-10 transition-all duration-300`}>
        {/* Logo */}
        <div className={`${sidebarCollapsed ? 'p-3' : 'p-6'} border-b border-slate-100`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-between gap-1' : 'gap-3'}`}>
            <div className={`${sidebarCollapsed ? 'w-9 h-9' : 'w-10 h-10'} bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0`}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden flex-1">
                <h1 className="text-slate-800 font-black tracking-tight text-sm whitespace-nowrap">GRUPOJENTA</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Super Admin</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shrink-0"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-2xl font-bold text-sm transition-all",
                  sidebarCollapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3.5',
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <item.icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 shrink-0'}`} />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
                {isActive && !sidebarCollapsed && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
            className={`w-full flex items-center rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all ${
              sidebarCollapsed ? 'justify-center py-3.5' : 'gap-3 px-4 py-3.5'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-8 z-20">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Panel de Administración</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-600">Admin</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-500/20">
                G
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
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
    </div>
  );
}
