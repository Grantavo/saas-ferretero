'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Building2, 
  ArrowLeft, 
  Save, 
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [tenantData, setTenantData] = useState({
    name: '',
    nit: '',
    address: '',
    phone: '',
  });
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const supabase = createClient();

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear el tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Crear módulos por defecto
      await supabase.rpc('create_default_modules', { p_tenant_id: tenant.id });

      // Crear permisos por rol por defecto
      await supabase.rpc('create_default_role_permissions', { p_tenant_id: tenant.id });

      // Crear suscripción trial
      await supabase.from('subscriptions').insert([{
        tenant_id: tenant.id,
        plan: 'trial',
        status: 'active',
      }]);

      setCreatedTenantId(tenant.id);
      setStep(2);
    } catch (error: any) {
      toast.error('Error al crear la ferretería: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          tenant_id: createdTenantId,
          role: 'admin',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido al crear usuario');
      }

      setShowCredentials(true);
    } catch (error: any) {
      console.error('[create-user] Error en frontend:', error);
      toast.error('Error al crear el usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeCredentials = () => {
    setShowCredentials(false);
    router.push('/admin/tenants');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link 
        href="/admin/tenants"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a negocios
      </Link>

      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Nuevo Negocio</h1>
        <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">
          Paso {step} de 2 — {step === 1 ? 'Datos de la empresa' : 'Crear usuario administrador'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-violet-500' : 'bg-slate-200'} transition-all`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-violet-500' : 'bg-slate-200'} transition-all`} />
      </div>

      {step === 1 ? (
        <motion.form 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleCreateTenant}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-6"
        >
          <div className="flex items-center gap-3 text-violet-600 font-black text-lg pb-4 border-b border-slate-100">
            <Building2 className="w-6 h-6" /> Datos del Negocio
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
            <input 
              required
              type="text"
              placeholder="Ej: Mi Negocio"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
              value={tenantData.name}
              onChange={(e) => setTenantData({...tenantData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">NIT</label>
              <input 
                required
                type="text"
                placeholder="900.000.000-1"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                value={tenantData.nit}
                onChange={(e) => setTenantData({...tenantData, nit: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
              <input 
                required
                type="tel"
                placeholder="310 123 4567"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                value={tenantData.phone}
                onChange={(e) => setTenantData({...tenantData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Dirección</label>
            <input 
              required
              type="text"
              placeholder="Calle 123 #45-67, Bogotá"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
              value={tenantData.address}
              onChange={(e) => setTenantData({...tenantData, address: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Siguiente: Crear Usuario →'}
          </button>
        </motion.form>
      ) : (
        <motion.form 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleCreateUser}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-6"
        >
          <div className="flex items-center gap-3 text-violet-600 font-black text-lg pb-4 border-b border-slate-100">
            <UserPlus className="w-6 h-6" /> Crear Usuario Administrador
          </div>

          <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
            <p className="text-xs font-bold text-violet-700">
              Este será el usuario dueño de la cuenta. Podrá acceder al dashboard completo de su ferretería.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="text"
                placeholder="Nombre del administrador"
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                value={userData.full_name}
                onChange={(e) => setUserData({...userData, full_name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="email"
                placeholder="cliente@correo.com"
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="text"
                placeholder="Contraseña para el cliente"
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
                value={userData.password}
                onChange={(e) => setUserData({...userData, password: e.target.value})}
              />
            </div>
            <p className="text-[10px] text-slate-400 ml-1 font-bold">La contraseña se muestra en texto plano para que puedas compartirla con el cliente.</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Crear Cuenta Completa</>}
          </button>
        </motion.form>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-slate-800">¡Cuenta creada!</h3>
              <p className="text-slate-500 text-sm mt-1">
                El negocio y el usuario administrador están listos.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(userData.email); toast.success('Email copiado'); }}
                  className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 break-all">{userData.email}</p>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contraseña</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(userData.password); toast.success('Contraseña copiada'); }}
                  className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 font-mono tracking-wider">{userData.password}</p>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-bold">
              El usuario ya está confirmado automáticamente. Comparte estas credenciales con el cliente.
            </p>

            <button
              onClick={closeCredentials}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:brightness-110 transition-all shadow-lg shadow-violet-500/20"
            >
              Ir a lista de negocios
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
