'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User as UserIcon, 
  Package, 
  Printer, 
  Save, 
  Loader2,
  X,
  ChevronDown,
  Filter,
  Calendar,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  brand: string;
  base_price: number;
  tax_percentage: number;
  stock: number;
  image_url: string | null;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: string;
  full_name: string;
  nit: string;
  address: string;
  phone: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [docType, setDocType] = useState<'sale' | 'quote'>('quote');

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: pData } = await supabase.from('products').select('*');
        if (pData) setProducts(pData);

        const { data: cData } = await supabase.from('customers').select('*');
        if (cData) setCustomers(cData);
      } catch (error: any) {
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} añadido`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.base_price * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + (item.base_price * (item.tax_percentage / 100) * item.quantity), 0);
  const total = subtotal + tax;

  const handlePrint = () => {
    if (!selectedCustomer) {
      toast.error('Por favor selecciona un cliente antes de continuar');
      return;
    }
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando Sistema POS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Buscadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar productos..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AnimatePresence>
            {searchTerm && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => { addToCart(p); setSearchTerm(''); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-none">
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                    </div>
                    <p className="font-black text-primary">{formatCurrency(p.base_price * (1 + p.tax_percentage/100))}</p>
                  </button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <AnimatePresence>
            {customerSearch && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[200px] overflow-y-auto">
                {customers.filter(c => c.full_name.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none">
                    <p className="font-bold text-slate-800 uppercase tracking-tight">{c.full_name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIT: {c.nit}</p>
                  </button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Área de Impresión / POS */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden print-area">
        {/* Header Corporativo */}
        <div className="p-10 border-b border-slate-100 flex justify-between items-start">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                {docType === 'quote' ? 'Cotización' : 'Factura'}
              </h1>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">GrupoJenta | Soluciones Ferreteras</p>
            </div>
            
            <div className="pt-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</label>
              {selectedCustomer ? (
                <div className="space-y-0.5">
                  <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.full_name}</p>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">NIT: {selectedCustomer.nit}</p>
                  <p className="text-sm font-medium text-slate-500">{selectedCustomer.address}</p>
                </div>
              ) : (
                <p className="text-slate-300 font-bold italic no-print">Selecciona un cliente para continuar</p>
              )}
            </div>
          </div>

          <div className="text-right space-y-6">
            <div className="no-print">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                <button onClick={() => setDocType('quote')} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", docType === 'quote' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}>Cotización</button>
                <button onClick={() => setDocType('sale')} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", docType === 'sale' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Factura</button>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900 uppercase">Número: #000{Math.floor(Math.random() * 1000)}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Fecha: {new Date().toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Vencimiento: {docType === 'quote' ? '8 Días' : 'Inmediato'}</p>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unitario (IVA Incl.)</th>
                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cart.map(item => (
                <tr key={item.id}>
                  <td className="px-10 py-5">
                    <p className="font-bold text-slate-800 uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.brand}</p>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-5 text-right font-bold text-slate-600">{formatCurrency(item.base_price * (1 + item.tax_percentage/100))}</td>
                  <td className="px-10 py-5 text-right font-black text-slate-900">{formatCurrency(item.base_price * (1 + item.tax_percentage/100) * item.quantity)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">No hay productos añadidos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="p-10 bg-slate-50/50 flex justify-between items-end border-t border-slate-100">
          <div className="max-w-xs">
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              Esta cotización es informativa y está sujeta a cambios sin previo aviso. Precios incluyen IVA del 19%.
            </p>
          </div>
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>IVA (19%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Neto</span>
              <span className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
            </div>
            
            <div className="pt-8 flex gap-3 no-print">
              <button onClick={handlePrint} className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button disabled={cart.length === 0} onClick={handlePrint} className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {docType === 'quote' ? 'Cotizar' : 'Facturar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
