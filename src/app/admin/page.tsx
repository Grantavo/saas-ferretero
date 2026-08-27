'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Plus,
  ArrowUpRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';

type OnlineUser = {
  id: string;
  full_name: string;
  role: string;
  last_seen_at: string;
  tenant_id: string;
  tenants: { name: string }[] | { name: string } | null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    tenants: 0,
    products: 0,
    sales: 0,
    users: 0,
  });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const [tenantsRes, productsRes, salesRes, usersRes] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        tenants: tenantsRes.count || 0,
        products: productsRes.count || 0,
        sales: salesRes.count || 0,
        users: usersRes.count || 0,
      });

      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentTenants(tenants || []);
    }
    fetchStats();
  }, []);

  // Poll de presencia: refresca cada 30s
  useEffect(() => {
    async function fetchOnline() {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, last_seen_at, tenant_id, tenants(name)')
        .gte('last_seen_at', twoMinutesAgo)
        .not('tenant_id', 'is', null)
        .order('last_seen_at', { ascending: false });

      setOnlineUsers((data as OnlineUser[]) || []);
    }

    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  // Agrupar usuarios online por tenant
  const onlineByTenant = onlineUsers.reduce<Record<string, { name: string; users: OnlineUser[] }>>((acc, u) => {
    const tid = u.tenant_id;
    const tRaw = u.tenants;
    const tName = Array.isArray(tRaw) ? tRaw?.[0]?.name : tRaw?.name || 'Desconocido';
    if (!acc[tid]) acc[tid] = { name: tName, users: [] };
    acc[tid].users.push(u);
    return acc;
  }, {});

  const kpis = [
    { label: 'Negocios Activos', value: stats.tenants, icon: Building2, color: 'from-violet-500 to-indigo-600', shadow: 'shadow-violet-500/20' },
    { label: 'Usuarios Totales', value: stats.users, icon: Users, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { label: 'Productos Registrados', value: stats.products, icon: Package, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Ventas Realizadas', value: stats.sales, icon: ShoppingCart, color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
          <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">Vista general del ecosistema</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Nuevo Negocio
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-4 relative overflow-hidden group hover:border-slate-200 hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 bg-gradient-to-br ${kpi.color} rounded-2xl flex items-center justify-center shadow-xl ${kpi.shadow}`}>
              <kpi.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-4xl font-black text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Negocios en Línea */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Wifi className="w-5 h-5 text-emerald-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <h2 className="font-black text-slate-800 text-lg">Negocios en Línea</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
            {Object.keys(onlineByTenant).length} activos
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(onlineByTenant).length > 0 ? (
            Object.entries(onlineByTenant).map(([tenantId, { name, users }]) => (
              <Link
                key={tenantId}
                href={`/admin/tenants/${tenantId}`}
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-lg group-hover:scale-110 transition-transform">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} en línea
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {users.slice(0, 3).map((u) => (
                    <span
                      key={u.id}
                      className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500"
                      title={u.full_name}
                    >
                      {u.full_name?.split(' ')[0] || '?'}
                    </span>
                  ))}
                  {users.length > 3 && (
                    <span className="text-[10px] font-bold text-slate-400">+{users.length - 3}</span>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-16 text-center">
              <WifiOff className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-sm">No hay negocios conectados ahora mismo.</p>
              <p className="text-slate-300 font-medium text-xs mt-1">Los usuarios aparecen cuando están activos en el dashboard.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-violet-600" />
            <h2 className="font-black text-slate-800 text-lg">Negocios Recientes</h2>
          </div>
          <Link href="/admin/tenants" className="text-xs font-black text-violet-600 hover:text-violet-500 flex items-center gap-1 uppercase tracking-widest">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentTenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants/${tenant.id}`}
              className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-gradient-to-br group-hover:from-violet-500/10 group-hover:to-indigo-500/10 group-hover:text-violet-600 transition-all">
                  {tenant.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{tenant.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Registrado: {new Date(tenant.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  tenant.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {tenant.is_active !== false ? 'Activa' : 'Inactiva'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </Link>
          ))}
          {recentTenants.length === 0 && (
            <div className="p-16 text-center">
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold text-sm">No hay ferreterías registradas aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
