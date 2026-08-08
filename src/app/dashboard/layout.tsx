'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Grid, 
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/providers/UserContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, tenant, loading } = useUser();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [showNotifications, setShowNotifications] = useState(false);

  const [lowStockItems, setLowStockItems] = useState<{ id: string; name: string; stock: number; min_stock: number }[]>([]);
  const [readLowStock, setReadLowStock] = useState<string[]>([]);
  const [readSales, setReadSales] = useState<string[]>([]);
  const [todaySales, setTodaySales] = useState<{ id: string; total_amount: number; created_at: string }[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchNotifications() {
      if (!profile?.tenant_id) return;

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [productsRes, salesRes] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, stock, min_stock')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('sales')
          .select('id, total_amount, created_at')
          .eq('tenant_id', profile.tenant_id)
          .gte('created_at', startOfToday.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (!productsRes.error) {
        const lowStock = (productsRes.data ?? []).filter(p => p.stock <= p.min_stock);
        setLowStockItems(lowStock);
      }

      if (!salesRes.error && salesRes.data) {
        setTodaySales(salesRes.data);
      }
    }

    fetchNotifications();
  }, [profile?.tenant_id, pathname]);

  useEffect(() => {
    if (!profile?.tenant_id) return;
    try {
      const stored = localStorage.getItem(`lowStockRead:${profile.tenant_id}`);
      if (stored) setReadLowStock(JSON.parse(stored));
      const storedSales = localStorage.getItem(`saleRead:${profile.tenant_id}`);
      if (storedSales) setReadSales(JSON.parse(storedSales));
    } catch {
      setReadLowStock([]);
      setReadSales([]);
    }
  }, [profile?.tenant_id]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowNotifications(false);
    };
    if (showUserMenu || showNotifications) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);

  const normalizedPath = pathname.replace(/\/$/, '') || '/dashboard';
  const isHome = normalizedPath === '/dashboard';

  const getSectionName = () => {
    if (isHome) return '';
    const parts = normalizedPath.split('/');
    const lastPart = parts[parts.length - 1];
    
    const names: Record<string, string> = {
      'inventory': 'Inventario',
      'pos': 'Punto de Venta',
      'new': 'Nuevo Registro',
      'import': 'Importación',
      'customers': 'Clientes',
      'sales': 'Ventas',
      'settings': 'Ajustes',
      'payments': 'Pagos',
      'history': 'Historial',
      'chat': 'Conversaciones',
      'calendar': 'Calendario',
      'tasks': 'Tareas',
    };
    
    // Si es un ID (UUID tiene guiones), mostrar "Detalle" o "Editar"
    if (lastPart.includes('-') && lastPart.length > 20) {
      return parts[parts.length - 2] === 'edit' ? 'Editar Producto' : 'Detalle';
    }
    
    return names[lastPart] || lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatCurrencyCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const markLowStockRead = (id: string) => {
    if (!profile?.tenant_id) return;
    const next = readLowStock.includes(id) ? readLowStock : [...readLowStock, id];
    setReadLowStock(next);
    localStorage.setItem(`lowStockRead:${profile.tenant_id}`, JSON.stringify(next));
  };

  const markSaleRead = (id: string) => {
    if (!profile?.tenant_id) return;
    const next = readSales.includes(id) ? readSales : [...readSales, id];
    setReadSales(next);
    localStorage.setItem(`saleRead:${profile.tenant_id}`, JSON.stringify(next));
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#f8f9ff]" />;

  const unreadLowStock = lowStockItems.filter(item => !readLowStock.includes(item.id));
  const unreadSales = todaySales.filter(sale => !readSales.includes(sale.id));
  const notificationCount = unreadLowStock.length + unreadSales.length;

  return (
    <div className="flex h-screen bg-[#f8f9ff] overflow-hidden">
      <div className="flex-1 flex flex-col relative min-w-0">
        <header className="sticky top-0 h-16 flex items-center justify-between px-4 sm:px-6 z-50 transition-all duration-300 border-b border-slate-200/50 bg-white/30 backdrop-blur-xl print:hidden">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-lg transition-all active:scale-95 group"
            >
              <Grid className={cn("w-6 h-6", isHome ? "text-slate-800" : "text-primary")} />
            </Link>
            
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            
            {!isHome ? (
              <span className="font-black text-slate-800 tracking-tight text-lg">
                {getSectionName()}
              </span>
            ) : (
              <span className="font-bold text-slate-800 tracking-tight">{tenant?.name?.toUpperCase() || 'FERRETERÍA'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
              {/* Notificaciones */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className={cn(
                    "p-2 rounded-lg transition-all relative",
                    showNotifications ? "bg-primary/10 text-primary" : "hover:bg-slate-100 text-slate-600"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white">
                      {notificationCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <p className="font-black text-slate-800 text-sm">Notificaciones</p>
                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Stock Bajo</span>
                      </div>
                      <div className="p-2 max-h-[300px] overflow-auto">
                        {unreadLowStock.length === 0 && unreadSales.length === 0 ? (
                          <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                            <p className="text-sm font-semibold text-slate-500">
                              No tienes notificaciones nuevas
                            </p>
                          </div>
                        ) : (
                          <>
                            {unreadLowStock.map(item => (
                              <div key={item.id} onClick={() => markLowStockRead(item.id)} className="p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                                <p className="text-xs font-bold text-slate-800">Stock bajo: {item.name}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Quedan {item.stock} unidades · mínimo {item.min_stock}.</p>
                              </div>
                            ))}
                            {unreadSales.map(sale => (
                              <div key={sale.id} onClick={() => { markSaleRead(sale.id); router.push(`/dashboard/sales/${sale.id}`); }} className="p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                                <p className="text-xs font-bold text-slate-800">Nueva Venta</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">Se ha registrado una venta por {formatCurrencyCOP(sale.total_amount)} · {new Date(sale.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.</p>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className="flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition-opacity"
              >
                <span className="text-sm font-bold text-slate-700 hidden sm:block uppercase tracking-tight">{tenant?.name || 'Ferretería'}</span>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">
                  {tenant?.name?.charAt(0)?.toUpperCase() || 'F'}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showUserMenu && "rotate-180")} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-50">
                      <p className="font-bold text-slate-800 text-sm">{profile?.full_name || user?.email}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{profile?.role === 'admin' ? 'Administrador' : profile?.role === 'accounting' ? 'Contabilidad' : profile?.role === 'seller' ? 'Ventas' : profile?.role === 'warehouse' ? 'Bodega' : profile?.role === 'marketing' ? 'Mercadeo' : 'Usuario'}</p>
                    </div>
                    <div className="p-2">
                      <Link 
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Ajustes
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className={cn(
          "flex-1 overflow-y-auto overflow-x-clip",
          isHome ? "p-0" : "p-4 sm:p-6 lg:p-8",
          "print:p-0"
        )}>
          <div className={cn(isHome ? "max-w-[1600px] mx-auto" : "max-w-7xl mx-auto")}>
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
