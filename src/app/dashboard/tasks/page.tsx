'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ClipboardList,
  AlertCircle
} from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Revisar stock de cemento gris', done: false, priority: 'high' },
    { id: 2, text: 'Llamar al proveedor de pinturas', done: true, priority: 'medium' },
    { id: 3, text: 'Organizar vitrina de herramientas manuales', done: false, priority: 'low' },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now(), text: newTask, done: false, priority: 'medium' }, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Tareas Pendientes</h1>
          <p className="text-muted-foreground mt-1">Organiza el trabajo diario de la ferretería.</p>
        </div>
      </div>

      <form onSubmit={addTask} className="relative group">
        <input 
          type="text" 
          placeholder="¿Qué hay que hacer hoy?..."
          className="w-full pl-6 pr-16 py-5 bg-white border border-slate-100 rounded-[32px] focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg font-medium shadow-sm"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-6 h-6" />
        </button>
      </form>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-6 rounded-[32px] border transition-all flex items-center justify-between group ${
                task.done ? 'bg-slate-50 border-slate-50 opacity-60' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`p-1 rounded-lg transition-colors ${task.done ? 'text-emerald-500' : 'text-slate-300 hover:text-primary'}`}
                >
                  {task.done ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                </button>
                <span className={`font-bold text-lg ${task.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {task.text}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  task.priority === 'high' ? 'bg-red-50 text-red-500' : 
                  task.priority === 'medium' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  {task.priority === 'high' ? 'Urgente' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <ClipboardList className="w-16 h-16 text-slate-100 mx-auto" />
            <p className="text-slate-400 font-bold">¡Todo listo! No tienes tareas pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
