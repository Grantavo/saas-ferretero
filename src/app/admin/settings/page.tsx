'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Settings, 
  User, 
  Mail, 
  Save, 
  Loader2,
  Shield,
  Key
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [userId, setUserId] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
    setProfile(prev => ({ ...prev, email: user.email || '' }));

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(prev => ({ ...prev, full_name: data.full_name || '' }));
    }
    setLoading(false);
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update full name in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update email in auth if changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email !== profile.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: profile.email });
        if (emailError) throw emailError;
        alert('Perfil guardado. Si cambiaste tu correo, revisa tu bandeja de entrada para confirmarlo.');
      } else {
        alert('Perfil guardado exitosamente.');
      }
    } catch (error: any) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Contraseña actualizada exitosamente.');
      setNewPassword('');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuración</h1>
        <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">
          Ajustes globales y perfil de super admin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveProfile}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6"
          >
            <div className="flex items-center gap-3 text-violet-600 font-black text-lg pb-4 border-b border-slate-100">
              <User className="w-6 h-6" /> Perfil del Administrador
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required
                    type="text"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email"
                    required
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </motion.form>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handlePasswordChange}
            className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6"
          >
            <div className="flex items-center gap-3 text-slate-800 font-black text-lg pb-4 border-b border-slate-100">
              <Key className="w-6 h-6 text-slate-400" /> Cambiar Contraseña
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="Escribe la nueva contraseña"
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={changingPassword}
              className="px-6 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Actualizar Contraseña
            </button>
          </motion.form>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-violet-50 rounded-[32px] border border-violet-100 p-8 space-y-4"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-violet-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Rol de Super Administrador</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Tienes acceso total a todas las configuraciones del sistema. Recuerda que los cambios realizados aquí pueden afectar a todos los clientes de la plataforma.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
