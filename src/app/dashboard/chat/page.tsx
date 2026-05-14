'use client';

import { useState } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  CheckCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(1);

  const chats = [
    { id: 1, name: 'Juan (Ventas)', lastMsg: '¿Llegó el pedido de tubos PVC?', time: '10:45', online: true },
    { id: 2, name: 'María (Bodega)', lastMsg: 'Stock actualizado de Stanley', time: '09:30', online: false },
    { id: 3, name: 'Grupo Ferretero', lastMsg: 'Nueva promoción de fin de mes', time: 'Ayer', online: true },
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
      {/* Sidebar Chat List */}
      <div className="w-80 border-r border-slate-50 flex flex-col bg-slate-50/30">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tight mb-6">Mensajes</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar chat..."
              className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/10 shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${
                activeChat === chat.id ? 'bg-white shadow-xl shadow-slate-200/50 scale-[1.02]' : 'hover:bg-white/50'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                  {chat.name.charAt(0)}
                </div>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-slate-900">{chat.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{chat.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              J
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Juan (Ventas)</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">En línea ahora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Phone className="w-5 h-5" /></button>
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><Video className="w-5 h-5" /></button>
            <button className="p-3 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-white rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">Hoy</span>
          </div>

          <div className="flex gap-4 max-w-lg">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-black shrink-0">J</div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 space-y-1">
              <p className="text-sm text-slate-700 leading-relaxed">Hola, ¿Llegó el pedido de tubos PVC de 1/2 pulgada? El cliente de la constructora está preguntando.</p>
              <p className="text-[10px] text-slate-400 text-right">10:45 AM</p>
            </div>
          </div>

          <div className="flex gap-4 max-w-lg ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-black shrink-0">F</div>
            <div className="bg-primary p-4 rounded-2xl rounded-tr-none shadow-xl shadow-primary/20 space-y-1 text-white">
              <p className="text-sm leading-relaxed">Hola Juan. Sí, acaba de entrar el camión. Ya los están descargando en la bodega norte.</p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] opacity-70">10:47 AM</span>
                <CheckCheck className="w-3 h-3 text-white/70" />
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-50">
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[28px] focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <button className="p-3 text-slate-400 hover:text-primary transition-colors"><Smile className="w-6 h-6" /></button>
            <button className="p-3 text-slate-400 hover:text-primary transition-colors"><Paperclip className="w-6 h-6" /></button>
            <input 
              type="text" 
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 font-medium"
            />
            <button className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
