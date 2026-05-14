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
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Importar los mismos iconos de lucide-react
import { 
  LayoutDashboard,
  Calendar,
  DollarSign
} from 'lucide-react';

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
      toast.error('Selecciona un cliente para imprimir');
      return;
    }
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          header, nav, .sidebar { display: none !important; }
        }
      `}</style>

      {/* Header Premium de Selección */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 sticky top-0 z-40 backdrop-blur-xl bg-white/90 no-print">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar productos..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => { addToCart(p); setSearchTerm(''); }} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-200" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-tight">{p.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                      </div>
                    </div>
                    <p className="font-black text-primary">{formatCurrency(p.base_price * (1 + p.tax_percentage/100))}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative md:w-1/3 group">
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar cliente..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <AnimatePresence>
            {customerSearch && (
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                {customers.filter(c => 
                  c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) || 
                  c.nit?.toLowerCase().includes(customerSearch.toLowerCase())
                ).map(c => (
                  <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none group">
                    <p className="font-bold text-slate-800 group-hover:text-primary transition-colors uppercase tracking-tight">{c.full_name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">NIT: {c.nit}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Documento Profesional */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden print-container">
        {/* Cabecera Negra de Lujo */}
        <div className="p-10 border-b border-slate-100 flex justify-between items-start">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3 no-print">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                <button onClick={() => setDocType('quote')} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", docType === 'quote' ? "bg-white text-primary shadow-sm" : "text-slate-400")}>Cotización</button>
                <button onClick={() => setDocType('sale')} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", docType === 'sale' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}>Factura</button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Información del Cliente</label>
              {selectedCustomer ? (
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedCustomer.full_name}</h2>
                  <p className="text-sm font-medium text-slate-500">{selectedCustomer.address}</p>
                  <p className="text-sm font-medium text-slate-500">{selectedCustomer.phone}</p>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">NIT: {selectedCustomer.nit}</p>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 italic font-bold uppercase text-[10px] tracking-widest no-print">
                  Selecciona un cliente para generar el documento
                </div>
              )}
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-6">
            <div className="text-right">
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {docType === 'quote' ? 'Cotización' : 'Factura de Venta'}
              </h1>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[9px] mt-2">GrupoJenta | Soluciones Ferreteras</p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-right">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha</label>
                <p className="font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vencimiento</label>
                <p className="font-bold text-slate-700">{docType === 'quote' ? '8 Días' : 'Contado'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Elegante */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/20">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Producto</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unitario (IVA Incl.)</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cart.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-bold text-slate-800 uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.brand}</p>
                  </td>
                  <td className="px-4 py-6 text-center">
                    <input 
                      type="number" 
                      min="1"
                      className="w-16 bg-transparent border-none text-center font-bold text-slate-700 p-0 focus:ring-0 no-print"
                      value={item.quantity}
                      onChange={(e) => {
                        const q = parseInt(e.target.value) || 1;
                        setCart(prev => prev.map(p => p.id === item.id ? {...p, quantity: q} : p));
                      }}
                    />
                    <span className="hidden print:inline font-bold text-slate-700">{item.quantity}</span>
                  </td>
                  <td className="px-4 py-6 text-right font-bold text-slate-600">{formatCurrency(item.base_price * (1 + item.tax_percentage/100))}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-900">{formatCurrency(item.base_price * (1 + item.tax_percentage/100) * item.quantity)}</td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-200">
                      <Package className="w-16 h-16 opacity-10" />
                      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sin productos en la orden</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de Página con Totales de Impacto */}
        <div className="p-10 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start gap-12 border-t border-slate-100">
          <div className="max-w-md space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Términos y Condiciones
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-wider">
              {docType === 'quote' 
                ? 'Esta cotización tiene una validez de 8 días. Los precios incluyen IVA. La entrega se realiza tras la confirmación del pago.'
                : 'Esta factura de venta se asimila en todos sus efectos legales a una letra de cambio. El no pago genera intereses de mora.'}
            </p>
          </div>

          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>IVA (19%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="pt-6 border-t border-slate-200 text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total a Pagar</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(total)}</span>
            </div>

            <div className="pt-8 flex gap-3 no-print">
              <button 
                onClick={handlePrint}
                disabled={cart.length === 0}
                className="flex-1 py-5 bg-white border border-slate-200 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
              <button 
                disabled={cart.length === 0}
                className={cn(
                  "flex-1 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all text-white flex items-center justify-center gap-2",
                  docType === 'sale' ? "bg-emerald-600 shadow-xl shadow-emerald-100" : "bg-primary shadow-xl shadow-primary/20"
                )}
              >
                <Save className="w-4 h-4" /> {docType === 'sale' ? 'Facturar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Iconos que faltaban
function Shield(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
  )
}
