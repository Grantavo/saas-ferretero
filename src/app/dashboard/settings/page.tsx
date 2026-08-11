'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, 
  Save, 
  Loader2, 
  KeyRound,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyData {
  name: string;
  nit: string;
  address: string;
  phone: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
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
            .select('name, nit, address, phone')
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('No se encontró el negocio del usuario');

      const { error } = await supabase
        .from('tenants')
        .update({ name: tenant.name, nit: tenant.nit, address: tenant.address, phone: tenant.phone })
        .eq('id', profile.tenant_id);

      if (error) throw error;
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Sesión no válida');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('La contraseña actual es incorrecta');

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración</h1>
        <p className="text-slate-500 font-medium">Gestiona los datos de tu ferretería y cuenta.</p>
      </div>

      <div className="space-y-6">
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
                value={tenant?.name || ''}
                onChange={(e) => setTenant(prev => prev ? { ...prev, name: e.target.value } : null)}
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
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                value={tenant?.phone || ''}
                onChange={(e) => setTenant(prev => prev ? { ...prev, phone: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Dirección</label>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                value={tenant?.address || ''}
                onChange={(e) => setTenant(prev => prev ? { ...prev, address: e.target.value } : null)}
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

        <div className="bg-white p-8 -mt-14 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-primary font-bold">
            <KeyRound className="w-5 h-5" />
            <span className="uppercase tracking-widest text-xs font-black">Cambiar Contraseña</span>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña Actual</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
