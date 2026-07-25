'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  Power,
  PowerOff,
  ExternalLink,
  Package,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TenantsListPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const supabase = createClient();

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setTenants(data || []);
      const ids = (data || []).map(t => t.id);

      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('tenant_id')
          .in('tenant_id', ids);

        const uc: Record<string, number> = {};
        profiles?.forEach(p => { uc[p.tenant_id] = (uc[p.tenant_id] || 0) + 1; });
        setUserCounts(uc);

        const { data: modules } = await supabase
          .from('tenant_modules')
          .select('tenant_id')
          .eq('is_active', true)
          .in('tenant_id', ids);

        const mc: Record<string, number> = {};
        modules?.forEach(m => { mc[m.tenant_id] = (mc[m.tenant_id] || 0) + 1; });
        setModuleCounts(mc);
      }
    }
    setLoading(false);
  }

  const promptToggle = (id: string, name: string, currentStatus: boolean) => {
    setToggleConfirm({ id, name, currentStatus });
  };

  const confirmToggle = async () => {
    if (!toggleConfirm) return;
    const { id, currentStatus } = toggleConfirm;
    setToggleConfirm(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success(currentStatus ? 'Negocio desactivado' : 'Negocio activado');
      fetchTenants();
    } catch (error: any) {
      toast.error('Error al cambiar estado: ' + error.message);
      setLoading(false);
    }
  };

  const promptDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    setDeleteConfirm(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/delete-tenant?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido al eliminar');
      }
      
      fetchTenants();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
      setLoading(false);
    }
  };

  const filtered = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nit?.includes(searchTerm)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedTenants = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Negocios</h1>
          <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">Gestión de cuentas de clientes</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Nuevo Negocio
        </Link>
      </div>

      {/* Metrics */}
      {tenants.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Total</p>
            <p className="text-3xl font-black text-slate-800 mt-1">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Activos</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{tenants.filter(t => t.is_active !== false).length}</p>
          </div>
          <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Inactivos</p>
            <p className="text-3xl font-black text-red-600 mt-1">{tenants.filter(t => t.is_active === false).length}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Buscar por nombre o NIT..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-medium shadow-sm"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>

      {/* Loading / Empty / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl animate-pulse" />
                    <div className="space-y-2.5">
                      <div className="w-28 h-3.5 bg-slate-200 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-14 h-5 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-1 h-1 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-14 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-1 h-1 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-14 h-3 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="border-t border-slate-100 p-4 grid grid-cols-2 gap-2">
                <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-10 bg-slate-200 rounded-xl col-span-2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-400">
            {searchTerm ? 'Sin resultados' : 'No hay negocios'}
          </h3>
          <p className="text-slate-300 mt-2 text-sm">
            {searchTerm
              ? `Ningún negocio coincide con "${searchTerm}"`
              : 'Aún no hay negocios registrados. Crea el primero.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTenants.map((tenant, i) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 hover:shadow-md transition-all group flex flex-col"
              >
                <div className="p-6 sm:p-8 space-y-5 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-gradient-to-br group-hover:from-violet-500/10 group-hover:to-indigo-500/10 group-hover:text-violet-600 transition-all">
                        {tenant.name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 line-clamp-1">{tenant.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          NIT: {tenant.nit || 'No registrado'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      tenant.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {tenant.is_active !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>{new Date(tenant.created_at).toLocaleDateString('es-CO')}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {userCounts[tenant.id] || 0}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {moduleCounts[tenant.id] || 0}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4 grid grid-cols-2 gap-2">
                  <Link 
                    href={`/admin/tenants/${tenant.id}`}
                    className="w-full text-center py-3 rounded-xl bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" /> Gest.
                  </Link>
                  <button 
                    onClick={() => promptToggle(tenant.id, tenant.name, tenant.is_active !== false)}
                    className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      tenant.is_active !== false 
                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {tenant.is_active !== false ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    {tenant.is_active !== false ? 'Desact.' : 'Activar'}
                  </button>
                  <button 
                    onClick={() => promptDelete(tenant.id, tenant.name)}
                    className="col-span-2 w-full py-3 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:border-slate-300 transition-all flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest disabled:opacity-30 hover:border-slate-300 transition-all flex items-center gap-1.5"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm Delete Modal */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center">Eliminar negocio</h3>
            <p className="text-slate-500 text-sm mt-2 text-center leading-relaxed">
              ¿Estás seguro de eliminar <strong className="text-slate-700">{deleteConfirm.name}</strong>?
              Esta acción eliminará todos sus datos asociados y las cuentas de sus empleados. No se puede deshacer.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Confirm Toggle Modal */}
      {toggleConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setToggleConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              toggleConfirm.currentStatus ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              {toggleConfirm.currentStatus
                ? <PowerOff className="w-6 h-6 text-amber-600" />
                : <Power className="w-6 h-6 text-emerald-600" />
              }
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center">
              {toggleConfirm.currentStatus ? 'Desactivar negocio' : 'Activar negocio'}
            </h3>
            <p className="text-slate-500 text-sm mt-2 text-center leading-relaxed">
              ¿Estás seguro de {toggleConfirm.currentStatus ? 'desactivar' : 'activar'} <strong className="text-slate-700">{toggleConfirm.name}</strong>?
              {toggleConfirm.currentStatus
                ? ' Los usuarios de este negocio no podrán acceder al sistema.'
                : ' Los usuarios volverán a tener acceso al sistema.'}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setToggleConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmToggle}
                className={`flex-1 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                  toggleConfirm.currentStatus
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {toggleConfirm.currentStatus ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
