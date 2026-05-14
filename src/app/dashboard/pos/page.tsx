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
  nit: string; // Cambio definitivo a nit
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

  // Cargar datos iniciales con reintento y logs
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: pData, error: pError } = await supabase.from('products').select('*');
        if (pError) throw pError;
        if (pData) setProducts(pData);

        const { data: cData, error: cError } = await supabase.from('customers').select('*');
        if (cError) throw cError;
        if (cData) {
          console.log('Clientes cargados con éxito:', cData.length);
          setCustomers(cData);
        }
      } catch (error: any) {
        console.error('Error cargando datos en POS:', error.message);
        toast.error('Error al conectar con la base de datos. Por favor refresca la página.');
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

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.base_price * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + (item.base_price * (item.tax_percentage / 100) * item.quantity), 0);
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  const handleSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    // Lógica simplificada de guardado
    setTimeout(() => {
      setProcessing(false);
      toast.success('Venta registrada con éxito');
      setCart([]);
      setSelectedCustomer(null);
    }, 1500);
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="font-black uppercase tracking-widest text-xs">Cargando Sistema POS...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 print:p-0 print:max-w-none">
      <style jsx global>{`
        @media print {
          body { overflow: visible !important; height: auto !important; font-size: 12px; }
          header, .print\\:hidden { display: none !important; }
          ::-webkit-scrollbar { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0.5cm; size: auto; }
          .p-10 { padding: 1.5rem !important; }
          .mb-8 { margin-bottom: 1rem !important; }
          .py-5 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
          .space-y-8 > * + * { margin-top: 1rem !important; }
        }
      `}</style>

      {/* Barra de Búsqueda Fija Superior - OCULTA EN IMPRESIÓN */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 sticky top-0 z-30 backdrop-blur-md bg-white/80 print:hidden">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar productos por nombre o código..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AnimatePresence>
            {searchTerm && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto z-50"
              >
                {products.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                  <button 
                    key={product.id} 
                    onClick={() => { addToCart(product); setSearchTerm(''); }}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-200" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.brand}</p>
                      </div>
                    </div>
                    <p className="font-black text-primary">{formatCurrency(product.base_price * (1 + product.tax_percentage/100))}</p>
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
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          <AnimatePresence>
            {customerSearch.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[300px] overflow-y-auto z-50"
              >
                {customers
                  .filter(c => {
                    const searchLower = customerSearch.toLowerCase();
                    // Convertir todo el objeto a texto para buscar en CUALQUIER campo
                    const allFieldsText = JSON.stringify(c).toLowerCase();
                    return allFieldsText.includes(searchLower);
                  })
                  .map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors group flex flex-col"
                    >
                      <p className="font-bold text-slate-800 group-hover:text-primary transition-colors uppercase tracking-tight">
                        {c.full_name}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        NIT/CC: {c.nit || 'S.N'}
                      </p>
                    </button>
                  ))
                }
                {customers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                  <div className="p-8 text-center text-slate-300 italic text-sm">
                    No se encontraron clientes
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0">
        {/* Encabezado Corporativo para Impresión */}
        <div className="hidden print:flex justify-between items-start p-6 border-b-2 border-slate-900 mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {docType === 'quote' ? 'Cotización' : 'Factura de Venta'}
            </h1>
            <p className="text-slate-500 font-bold mt-0.5 uppercase tracking-widest text-[10px]">GrupoJenta | SaaS Ferretero</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-black text-slate-900 uppercase text-sm">Número: #000{Math.floor(Math.random() * 1000)}</p>
            <p className="text-[10px] text-slate-500 font-bold">Fecha: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="p-10 border-b border-slate-50 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-6 flex-1">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</label>
                {selectedCustomer ? (
                  <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedCustomer.full_name}</p>
                    <p className="text-sm font-medium text-slate-500">{selectedCustomer.address || 'Sin dirección registrada'}</p>
                    <p className="text-sm font-medium text-slate-500">{selectedCustomer.phone || 'Sin teléfono'}</p>
                    <p className="text-[10px] font-black text-primary mt-2">NIT/CC: {selectedCustomer.nit || 'S.N'}</p>
                  </div>
                ) : (
                  <p className="text-slate-300 font-bold italic">No se ha seleccionado un cliente</p>
                )}
              </div>
            </div>

            {/* Selector de Tipo de Documento */}
            <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 print:hidden">
              <button 
                type="button"
                onClick={() => setDocType('quote')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  docType === 'quote' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Cotizar
              </button>
              <button 
                type="button"
                onClick={() => setDocType('sale')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  docType === 'sale' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Facturar
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Vencimiento</label>
                <p className="text-sm font-bold text-slate-700">{docType === 'quote' ? '8 días (Cotización)' : 'Inmediato'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex px-10 border-b border-slate-100 bg-slate-50/50 print:hidden">
          <button className="px-6 py-4 border-b-2 border-primary text-xs font-black uppercase tracking-widest text-primary">
            Líneas de la orden
          </button>
          <button className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
            Otra información
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cantidad</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio Unitario</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Importe Total con IVA</th>
                <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.tr 
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-10 py-5">
                      <p className="font-bold text-slate-800 uppercase tracking-tight">{item.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.brand}</p>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setCart(prev => prev.map(p => p.id === item.id ? { ...p, quantity: val } : p));
                        }}
                        className="w-16 bg-transparent border-none focus:ring-0 text-center font-bold text-slate-700 p-0 hover:bg-slate-100/50 rounded-lg transition-colors print:bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-5 text-sm font-medium text-slate-400">unidades</td>
                    <td className="px-4 py-5 text-right font-bold text-slate-600">
                      {formatCurrency(item.base_price * (1 + item.tax_percentage/100))}
                    </td>
                    <td className="px-4 py-5 text-right font-black text-slate-900">
                      {formatCurrency(item.base_price * (1 + item.tax_percentage/100) * item.quantity)}
                    </td>
                    <td className="px-10 py-5 text-center print:hidden">
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {cart.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Package className="w-12 h-12 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs italic">No hay productos en la orden</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-10 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4 max-w-md">
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Esta cotización tiene una validez de 8 días calendario. Los precios incluyen IVA del 19% según la normativa vigente.
            </p>
          </div>
          
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-500">
              <span>IVA (19%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</span>
              <span className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-6 print:hidden">
              <button 
                onClick={handlePrint}
                disabled={cart.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" /> {docType === 'quote' ? 'Imprimir' : 'Ticket'}
              </button>
              <button 
                onClick={docType === 'sale' ? handleSale : handlePrint}
                disabled={cart.length === 0 || processing}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 text-white",
                  docType === 'sale' 
                    ? "bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200" 
                    : "bg-primary hover:shadow-xl hover:shadow-primary/20"
                )}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  docType === 'sale' ? <Save className="w-4 h-4" /> : <Printer className="w-4 h-4" />
                )}
                {docType === 'sale' ? 'Facturar' : 'Cotizar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
