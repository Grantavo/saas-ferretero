'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Search, 
  Plus, 
  MoreVertical,
  Power,
  PowerOff,
  ExternalLink,
  Loader2,
  Package,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function TenantsListPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setTenants(data || []);
    setLoading(false);
  }

  const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('tenants').update({ is_active: !currentStatus }).eq('id', id);
    fetchTenants();
  };

  const deleteTenant = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas ELIMINAR la ferretería "${name}"? Esta acción no se puede deshacer y eliminará todos sus datos asociados y las cuentas de sus empleados.`)) {
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
        alert('Error al eliminar: ' + error.message);
        setLoading(false);
      }
    }
  };

  const filtered = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nit?.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ferreterías</h1>
          <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">Gestión de cuentas de clientes</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="w-5 h-5" /> Nueva Ferretería
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Buscar por nombre o NIT..."
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-medium shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tenant, i) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="p-8 space-y-6 flex-1">
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

                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Creada: {new Date(tenant.created_at).toLocaleDateString('es-CO')}
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
                  onClick={() => toggleTenantStatus(tenant.id, tenant.is_active !== false)}
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
                  onClick={() => deleteTenant(tenant.id, tenant.name)}
                  className="col-span-2 w-full py-3 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
