'use client';

import { useState } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  User, 
  Bell, 
  CreditCard,
  CheckCircle2,
  Save,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '@/providers/UserContext';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { tenant } = useUser();

  const tabs = [
    { id: 'general', name: 'General', icon: Building2 },
    { id: 'billing', name: 'Suscripción', icon: CreditCard },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Ajustes del Sistema</h1>
        <p className="text-muted-foreground mt-1">Configuración global de tu ferretería.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-[#e2e8f0] text-black shadow-sm border border-[#cbd5e1]' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-primary" : "text-slate-400")} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-8 relative overflow-hidden">
          {activeTab === 'general' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-6">
                <div className="flex items-center gap-2 font-black text-slate-800 text-xl">
                  <Building2 className="w-6 h-6 text-primary" /> Información de la Empresa
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Solo Lectura</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <div className="w-full px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                    {tenant?.name || 'Cargando...'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT / Identificación</label>
                  <div className="w-full px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                    {tenant?.nit || 'No Registrado'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo de Contacto</label>
                  <div className="w-full px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-slate-700 italic">
                    {tenant?.email || 'N/A'}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <div className="w-full px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-bold text-slate-700">
                    {tenant?.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100/50 flex gap-4 items-start">
                <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong>Información Protegida:</strong> Por políticas de seguridad de GrupoJenta, los datos principales de la empresa solo pueden ser modificados por el equipo de soporte de <strong>GrupoJenta</strong> mediante una solicitud formal.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-2 font-black text-slate-800 text-xl border-b border-slate-50 pb-4 mb-6">
                <CreditCard className="w-6 h-6 text-primary" /> Plan y Facturación
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Plan Actual</p>
                  <h3 className="text-3xl font-black mt-2">PREMIUM PRO</h3>
                  <div className="mt-8 flex items-end gap-1">
                    <span className="text-4xl font-black">$120.000</span>
                    <span className="text-sm opacity-50 mb-1">/ mes</span>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Activo</span>
                    <span className="text-xs font-bold opacity-50 italic">Renueva: 15 Jun 2026</span>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Cobro</p>
                    <p className="text-2xl font-black text-slate-800 mt-2">15 de Junio, 2026</p>
                    <p className="text-sm text-slate-500 mt-1">Se cargará a tu tarjeta terminada en **4242</p>
                  </div>
                  <button className="w-full mt-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
                    Ver Historial de Facturas
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-black text-slate-800 ml-1 uppercase tracking-widest">Beneficios de tu Plan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Usuarios Ilimitados', 'Soporte 24/7 Premium', 'Backups Automáticos', 'Módulos Personalizados'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
