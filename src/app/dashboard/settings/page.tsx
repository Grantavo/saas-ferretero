'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2,
  Shield,
  CreditCard,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  business_name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadTenant() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          const { data } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();
          
          if (data) setTenant(data);
        }
      } catch (error) {
        toast.error('Error al cargar configuración');
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('tenants')
        .update(tenant)
        .eq('id', tenant.id);

      if (error) throw error;
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-slate-500 font-medium">Gestiona los datos de tu ferretería y cuenta.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-primary font-bold">
            <Building2 className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs font-black">Datos de la Empresa</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Comercial</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                value={tenant?.business_name || ''}
                onChange={(e) => setTenant(prev => prev ? { ...prev, business_name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">NIT</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                value={tenant?.nit || ''}
                onChange={(e) => setTenant(prev => prev ? { ...prev, nit: e.target.value } : null)}
              />
            </div>
          </div>
        </div>

        <button 
          disabled={saving}
          className="w-full py-6 bg-primary text-white rounded-[32px] font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
