'use client';

import { History, Package, UserPlus, ShoppingCart, Settings, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryPage() {
  const activities = [
    { id: 1, type: 'sale', text: 'Venta realizada #AB12 (Efectivo)', time: 'Hace 5 minutos', icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-600' },
    { id: 2, type: 'product', text: 'Nuevo producto agregado: Martillo Stanley', time: 'Hace 2 horas', icon: Package, color: 'bg-orange-100 text-orange-600' },
    { id: 3, type: 'customer', text: 'Nuevo cliente registrado: Constructora S.A.', time: 'Ayer, 03:20 PM', icon: UserPlus, color: 'bg-indigo-100 text-indigo-600' },
    { id: 4, type: 'settings', text: 'Ajustes del sistema actualizados', time: 'Ayer, 10:15 AM', icon: Settings, color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
          <History className="w-8 h-8 text-primary" /> Historial de Actividad
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Registro cronológico de todas las operaciones</p>
      </div>

      <div className="relative space-y-8 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
        {activities.map((activity, i) => (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-8 relative z-10"
          >
            <div className={`w-16 h-16 rounded-[30%] flex items-center justify-center shrink-0 shadow-lg ${activity.color}`}>
              <activity.icon className="w-8 h-8" />
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex-1 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{activity.text}</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.time}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Operación realizada por el administrador principal desde el módulo correspondiente.</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
