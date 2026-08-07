'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  BarChart3, 
  CreditCard,
  History,
  LayoutGrid,
  MessagesSquare,
  Calendar,
  ClipboardList,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/providers/UserContext';

const moduleIconMap: Record<string, any> = {
  inventory: Package,
  pos: ShoppingCart,
  sales: BarChart3,
  customers: Users,
  payments: CreditCard,
  history: History,
  chat: MessagesSquare,
  calendar: Calendar,
  tasks: ClipboardList,
  settings: Settings,
};

const moduleColorMap: Record<string, string> = {
  inventory: 'bg-orange-500',
  pos: 'bg-emerald-500',
  sales: 'bg-blue-500',
  customers: 'bg-indigo-500',
  payments: 'bg-purple-500',
  history: 'bg-slate-600',
  chat: 'bg-amber-500',
  calendar: 'bg-rose-500',
  tasks: 'bg-teal-500',
  settings: 'bg-slate-400',
};

const moduleHrefMap: Record<string, string> = {
  inventory: '/dashboard/inventory',
  pos: '/dashboard/pos',
  sales: '/dashboard/sales',
  customers: '/dashboard/customers',
  payments: '/dashboard/payments',
  history: '/dashboard/history',
  chat: '/dashboard/chat',
  calendar: '/dashboard/calendar',
  tasks: '/dashboard/tasks',
  settings: '/dashboard/settings',
};

export default function DashboardPage() {
  const [modules, setModules] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const supabase = createClient();
  const { profile, tenant, loading } = useUser();

  useEffect(() => {
    async function fetchModules() {
      if (!profile?.tenant_id) return;

      const [modulesRes, permsRes] = await Promise.all([
        supabase
          .from('tenant_modules')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true)
          .order('module_name'),
        supabase
          .from('role_permissions')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('role', profile.role || 'admin'),
      ]);

      if (modulesRes.error || !modulesRes.data) {
        // Sin fallback hardcodeado: si falla la consulta, estado vacío.
        setModules([]);
        setModulesLoading(false);
        return;
      }

      // Intersección estricta: el dashboard muestra SOLO los módulos activos
      // que el rol del usuario tiene permitidos (ni uno más ni uno menos).
      // Si el rol no tiene permisos registrados, no ve nada.
      const allowedKeys = new Set(
        (permsRes.data || []).filter(p => p.can_access).map(p => p.module_key)
      );
      const filtered = (permsRes.data && permsRes.data.length > 0)
        ? modulesRes.data.filter(m => allowedKeys.has(m.module_key))
        : [];

      setModules(filtered);
      setModulesLoading(false);
    }

    if (!loading && profile) {
      fetchModules();
    }
  }, [profile, loading, supabase]);

  if (loading || modulesLoading) {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] via-[#f1f4ff] to-[#eef2ff]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-gradient-to-br from-[#f8f9ff] via-[#f1f4ff] to-[#eef2ff] p-8 md:p-16 overflow-x-clip flex items-center justify-center">
      <div className="max-w-6xl mx-auto w-full">
        {modules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-24 gap-3"
          >
            <LayoutGrid className="w-12 h-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-600">
              No tienes módulos habilitados
            </p>
            <p className="text-sm text-slate-400 max-w-sm">
              Contacta al administrador del negocio para que te habilite acceso a las aplicaciones activas.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center items-center gap-x-8 gap-y-12"
          >
            {modules.map((mod, i) => {
              const Icon = moduleIconMap[mod.module_key] || Package;
              const color = moduleColorMap[mod.module_key] || 'bg-slate-500';
              const href = moduleHrefMap[mod.module_key] || '/dashboard';

              return (
                <motion.div
                  key={mod.module_key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={href} className="flex flex-col items-center group">
                    <div className={`w-20 h-20 md:w-24 md:h-24 ${color} rounded-[28%] flex items-center justify-center shadow-xl shadow-slate-200 group-hover:scale-110 group-active:scale-95 transition-all duration-300 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="mt-4 text-sm font-semibold text-slate-700 tracking-wide text-center">
                      {mod.module_name}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
