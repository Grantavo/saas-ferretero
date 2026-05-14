'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const payments = [
    { id: 1, type: 'income', customer: 'Constructora S.A.', amount: 5400000, date: 'Hoy, 10:20 AM', status: 'completed' },
    { id: 2, type: 'debt', customer: 'Pedro Picapiedra', amount: 150000, date: 'Ayer', status: 'pending' },
    { id: 3, type: 'income', customer: 'Ferretería El Sol', amount: 890000, date: '10 May, 2024', status: 'completed' },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Pagos y Carteras</h1>
          <p className="text-muted-foreground mt-1">Control de ingresos y cuentas por cobrar.</p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-primary/20">
          <CreditCard className="w-5 h-5" /> Registrar Pago
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total por cobrar</p>
          <h3 className="text-3xl font-black text-red-500">{formatCurrency(1250000)}</h3>
        </div>
        <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudado (Mes)</p>
          <h3 className="text-3xl font-black text-emerald-600">{formatCurrency(12450000)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>TODOS</button>
            <button onClick={() => setActiveFilter('completed')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>PAGADOS</button>
            <button onClick={() => setActiveFilter('pending')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'pending' ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>PENDIENTES</button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar pago..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Entidad</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    {p.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Pagado</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 font-bold text-[10px] uppercase tracking-widest"><Clock className="w-3 h-3" /> Pendiente</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800 text-sm">{p.customer}</p>
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-400 font-medium">{p.date}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">{formatCurrency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
