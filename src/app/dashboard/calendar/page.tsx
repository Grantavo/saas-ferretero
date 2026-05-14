'use client';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const date = new Date();
  const currentMonth = date.toLocaleString('es-CO', { month: 'long' });
  const currentYear = date.getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Agenda Ferretera</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Programación de entregas y pedidos</p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" /> Agendar Entrega
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-slate-800 capitalize">{currentMonth} {currentYear}</h2>
            <div className="flex gap-2">
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all"><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-slate-100 transition-all"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4">
            {days.map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                className={`aspect-square p-4 rounded-[24%] border transition-all relative group cursor-pointer ${
                  i === 14 ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105 z-10' : 'bg-white border-slate-50 hover:border-primary/20 hover:bg-slate-50'
                }`}
              >
                <span className="text-sm font-black">{i + 1}</span>
                {i === 10 && (
                  <div className="absolute bottom-2 left-2 right-2 h-1 bg-orange-400 rounded-full" />
                )}
                {i === 14 && (
                  <div className="absolute bottom-4 left-4 right-4 text-[8px] font-black uppercase tracking-tight leading-tight hidden md:block">
                    Pedido Stanley
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-6">
          <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl space-y-6">
            <h3 className="font-black text-lg border-b border-white/10 pb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Próximas Entregas
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">14:00 PM</p>
                <p className="text-xs font-bold">Entrega: 50 Bultos Cemento</p>
                <p className="text-[10px] opacity-40">Cliente: Ferretería Central</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">16:30 PM</p>
                <p className="text-xs font-bold">Recoger pedido: Stanley S.A.</p>
                <p className="text-[10px] opacity-40">Bodega Norte</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
