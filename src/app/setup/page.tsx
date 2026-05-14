'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Hammer, Building2, User, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ferreteriaName, setFerreteriaName] = useState('');
  const [adminName, setAdminName] = useState('');
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Crear el Tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name: ferreteriaName }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Aquí normalmente registraríamos al usuario en Auth,
      // pero para esta prueba vamos a saltar a la creación del perfil
      // Nota: En un flujo real, usaríamos supabase.auth.signUp()
      
      alert('¡Configuración inicial completada! Tenant creado: ' + tenant.name);
      router.push('/dashboard');
    } catch (error: any) {
      alert('Error en la configuración: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-primary/10 p-4 rounded-2xl mb-6">
            <Hammer className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Configuración Inicial</h1>
          <p className="text-muted-foreground mt-2">Vamos a preparar tu espacio de trabajo</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Nombre de tu Ferretería</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                required
                type="text" 
                placeholder="Ej: Ferretería El Martillo"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={ferreteriaName}
                onChange={(e) => setFerreteriaName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold ml-1">Tu Nombre (Administrador)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                required
                type="text" 
                placeholder="Tu nombre completo"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Configurando...' : 'Finalizar Configuración'} 
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
