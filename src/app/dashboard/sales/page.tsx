'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Calendar, 
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2
} from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, tax: 0 });

  const supabase = createClient();

  useEffect(() => {
    async function fetchSales() {
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSales(data);
          const total = data.reduce((acc, s) => acc + Number(s.total_amount), 0);
          const tax = data.reduce((acc, s) => acc + Number(s.total_tax), 0);
          setStats({ total, count: data.length, tax });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Ventas</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Historial completo de transacciones realizadas.</p>
        </div>
        <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-xs">
          <Download className="w-4 h-4 text-slate-500" /> Exportar Reporte
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="p-5 md:p-8 bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2.5 md:p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">Hoy</span>
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Ingresos Totales</p>
          <h3 className="text-xl md:text-3xl font-black text-slate-900">{formatCurrency(stats.total)}</h3>
        </div>

        <div className="p-5 md:p-8 bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2.5 md:p-3 bg-blue-50 rounded-2xl text-blue-600">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Facturas Generadas</p>
          <h3 className="text-xl md:text-3xl font-black text-slate-900">{stats.count}</h3>
        </div>

        <div className="p-5 md:p-8 bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-start">
            <div className="p-2.5 md:p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">IVA Recaudado (19%)</p>
          <h3 className="text-xl md:text-3xl font-black text-slate-900">{formatCurrency(stats.tax)}</h3>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-bold text-slate-500">Cargando transacciones...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Sin ventas registradas</h3>
            <p className="text-muted-foreground text-sm">Realiza tu primera venta en el POS para verla aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="hidden sm:table-cell px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Método</th>
                  <th className="px-3 md:px-6 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.map((sale, i) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-4 md:px-8 py-3 md:py-5">
                      <span className="font-bold text-slate-900 text-xs md:text-sm">#{sale.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-[11px] md:text-sm text-slate-500 font-medium">
                      {new Date(sale.created_at).toLocaleString('es-CO')}
                    </td>
                    <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-5">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                        Efectivo
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-5 text-right">
                      <span className="font-black text-slate-900 text-sm md:text-lg">{formatCurrency(sale.total_amount)}</span>
                    </td>
                    <td className="px-4 md:px-8 py-3 md:py-5">
                      <div className="flex justify-center">
                        <Link
                          href={`/dashboard/sales/${sale.id}`}
                          className="p-1.5 md:p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 text-slate-400 hover:text-primary transition-all"
                        >
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
