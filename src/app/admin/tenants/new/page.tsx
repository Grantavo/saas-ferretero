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
      alert('Error al crear la ferretería: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear usuario a través de nuestra API segura (que usa Service Role)
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

      alert(`¡Negocio y usuario creados exitosamente!\n\nEl usuario ya está confirmado automáticamente.\n\nCredenciales del cliente:\nEmail: ${userData.email}\nContraseña: ${userData.password}`);
      router.push('/admin/tenants');
    } catch (error: any) {
      alert('Error al crear el usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
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

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">NIT</label>
              <input 
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
                type="text"
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
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 disabled:opacity-50"
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
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Crear Cuenta Completa</>}
          </button>
        </motion.form>
      )}
    </div>
  );
}
