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
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerFocused, setCustomerFocused] = useState(0);
  const customerBoxRef = useRef<HTMLDivElement | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productOpen, setProductOpen] = useState(false);
  const [productFocused, setProductFocused] = useState(0);
  const productBoxRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [docType, setDocType] = useState<'sale' | 'quote'>('quote');
  const [paymentTerm, setPaymentTerm] = useState<'cash' | 'credit'>('cash');
  const [notes, setNotes] = useState('');

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

  const updateQuantity = (id: string, newQty: number) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, newQty) } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.base_price * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + (item.base_price * (item.tax_percentage / 100) * item.quantity), 0);
  const total = subtotal + tax;
  const effectiveIvaRate = subtotal > 0 ? Math.round((tax / subtotal) * 100) : 0;

  const filteredCustomers = customers.filter(c =>
    c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.nit?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setCustomerOpen(false);
      }
      if (productBoxRef.current && !productBoxRef.current.contains(e.target as Node)) {
        setProductOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCustomerFocused(0);
  }, [customerSearch, customerOpen]);

  useEffect(() => {
    setProductFocused(0);
  }, [productSearch, productOpen]);

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCustomerOpen(true);
      setCustomerFocused((f) => (filteredCustomers.length ? (f + 1) % filteredCustomers.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCustomerFocused((f) => (filteredCustomers.length ? (f - 1 + filteredCustomers.length) % filteredCustomers.length : 0));
    } else if (e.key === 'Enter') {
      if (filteredCustomers[customerFocused]) {
        setSelectedCustomer(filteredCustomers[customerFocused]);
        setCustomerSearch('');
        setCustomerOpen(false);
      }
    } else if (e.key === 'Escape') {
      setCustomerOpen(false);
      e.currentTarget.blur();
    }
  };

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProductOpen(true);
      setProductFocused((f) => (filteredProducts.length ? (f + 1) % filteredProducts.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProductFocused((f) => (filteredProducts.length ? (f - 1 + filteredProducts.length) % filteredProducts.length : 0));
    } else if (e.key === 'Enter') {
      if (filteredProducts[productFocused]) {
        addToCart(filteredProducts[productFocused]);
        setProductSearch('');
        setProductOpen(false);
      }
    } else if (e.key === 'Escape') {
      setProductOpen(false);
      e.currentTarget.blur();
    }
  };

  const handlePrint = () => {
    if (!selectedCustomer) {
      toast.error('Selecciona un cliente para imprimir');
      return;
    }
    window.print();
  };

  const handleCheckout = async () => {
    if (processing || cart.length === 0) return;

    if (paymentTerm === 'credit' && !selectedCustomer) {
      toast.error('Selecciona un cliente para vender a crédito');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));

      const { data: saleId, error } = await supabase.rpc('record_sale_with_customer', {
        p_items: items,
        p_payment_method: paymentTerm,
        p_customer_id: selectedCustomer?.id ?? null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (saleId) {
        await supabase
          .from('sales')
          .update({
            customer_name: selectedCustomer?.full_name ?? null,
            customer_nit: selectedCustomer?.nit ?? null,
            customer_address: selectedCustomer?.address ?? null,
            customer_phone: selectedCustomer?.phone ?? null,
            notes: notes || null,
          })
          .eq('id', saleId);
      }

      handlePrint();
      toast.success('Factura procesada correctamente');
      setCart([]);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 sm:space-y-8 pb-20">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-container, .print-container * { visibility: visible !important; }
          .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Búsqueda */}
      <div className="bg-white p-4 sm:p-5 md:p-8 rounded-[24px] sm:rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm no-print">
        {/* Buscar Cliente */}
        <div className="relative w-full" ref={customerBoxRef}>
          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={selectedCustomer ? selectedCustomer.full_name : "Buscar cliente..."}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-sm md:text-base"
            value={selectedCustomer ? '' : customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setCustomerOpen(true); }}
            onFocus={() => setCustomerOpen(true)}
            onKeyDown={handleCustomerKeyDown}
          />
          <AnimatePresence>
            {customerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
              >
                {filteredCustomers.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                      {customerSearch ? 'Sin resultados' : 'Empieza a escribir para buscar'}
                    </p>
                    {customerSearch && (
                      <p className="text-xs text-slate-400 mt-1">No se encontró un cliente con "{customerSearch}"</p>
                    )}
                  </div>
                ) : (
                  filteredCustomers.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerOpen(false); }}
                      onMouseEnter={() => setCustomerFocused(i)}
                      className={cn(
                        "w-full p-4 text-left border-b border-slate-50 last:border-none transition-colors",
                        i === customerFocused ? "bg-primary/[0.04]" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-sm shrink-0">
                          {c.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 uppercase tracking-tight text-sm md:text-base truncate">{c.full_name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.nit}</p>
                        </div>
                        {c.phone ? (
                          <span className="ml-auto text-[10px] font-bold text-slate-400 whitespace-nowrap">{c.phone}</span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Documento */}
      <div className="bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden print-container">
        <div className="p-4 sm:p-5 md:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-4 md:gap-10">
          {/* Columna Izquierda: Cliente */}
          <div className="flex-1 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block no-print pt-6 md:pt-14">Información del Cliente</label>
            {selectedCustomer ? (
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedCustomer.full_name}</h2>
                <p className="text-sm font-medium text-slate-500">{selectedCustomer.address}</p>
                <p className="text-sm font-medium text-slate-500">{selectedCustomer.phone}</p>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">{selectedCustomer.nit}</p>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300 italic font-bold uppercase text-[10px] tracking-widest no-print">
                Selecciona un cliente
              </div>
            )}

            {/* Buscar Productos */}
            <div className="pt-4 no-print">
              <div className="relative w-full" ref={productBoxRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos para añadir..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-sm md:text-base"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductOpen(true); }}
                onFocus={() => setProductOpen(true)}
                onKeyDown={handleProductKeyDown}
              />
              <AnimatePresence>
                {productOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 max-h-[300px] overflow-y-auto"
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                          {productSearch ? 'Sin resultados' : 'Empieza a escribir para buscar'}
                        </p>
                        {productSearch && (
                          <p className="text-xs text-slate-400 mt-1">No se encontró un producto con "{productSearch}"</p>
                        )}
                      </div>
                    ) : (
                      filteredProducts.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => { addToCart(p); setProductSearch(''); setProductOpen(false); }}
                          onMouseEnter={() => setProductFocused(i)}
                          className={cn(
                            "w-full p-3 md:p-4 flex items-center justify-between text-left transition-colors border-b border-slate-50 last:border-none",
                            i === productFocused ? "bg-primary/[0.04]" : "hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center gap-3 md:gap-4 text-left min-w-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 md:w-6 md:h-6 text-slate-200" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 uppercase tracking-tight text-sm md:text-base truncate">{p.name}</p>
                              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.brand}</p>
                              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-0.5">
                                Stock: <span className={cn(p.stock <= 0 ? "text-red-500" : "text-slate-500")}>{p.stock}</span>
                              </p>
                            </div>
                          </div>
                          <p className="font-black text-primary text-sm md:text-base whitespace-nowrap ml-3">{formatCurrency(p.base_price * (1 + p.tax_percentage/100))}</p>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Datos Documento */}
          <div className="w-full md:w-auto text-left md:text-right flex flex-col items-start md:items-end gap-6">
            <div className="no-print">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                <button onClick={() => setDocType('quote')} className={cn("px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all", docType === 'quote' ? "bg-white text-primary shadow-sm" : "text-slate-400")}>Cotización</button>
                <button onClick={() => setDocType('sale')} className={cn("px-4 md:px-6 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all", docType === 'sale' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}>Factura</button>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 w-full">
              <div className="flex justify-between items-center gap-4 md:gap-8">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</label>
                <p className="font-bold text-slate-700 text-xs md:text-sm text-right">{docType === 'quote' ? new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : 'Inmediato'}</p>
              </div>
              <div className="flex justify-between items-center gap-4 md:gap-8">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de precios</label>
                <p className="font-bold text-slate-700 text-xs md:text-sm text-right">Predeterminado (COP)</p>
              </div>
              <div className="flex justify-between items-center gap-4 md:gap-8">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{docType === 'quote' ? 'Vigencia' : 'Pago'}</label>
                {docType === 'quote' ? (
                  <p className="font-bold text-slate-700 text-sm">8 Días</p>
                ) : (
                  <div className="flex bg-slate-100 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPaymentTerm('cash')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        paymentTerm === 'cash' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Contado
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentTerm('credit')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                        paymentTerm === 'credit' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
                      )}
                    >
                      Crédito
                    </button>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-50 flex justify-between items-center gap-4 md:gap-8">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Emisión</label>
                <p className="font-bold text-slate-700 text-xs md:text-sm">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/20">
                <th className="px-3 sm:px-4 md:px-10 py-3 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Descripción</th>
                <th className="w-14 sm:w-16 md:w-24 px-1.5 sm:px-2 md:px-4 py-3 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="hidden sm:table-cell w-28 md:w-32 px-2 md:px-4 py-3 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
                <th className="hidden sm:table-cell w-24 md:w-32 px-2 md:px-4 py-3 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">IVA</th>
                <th className="w-24 sm:w-28 md:w-40 px-3 sm:px-4 md:px-10 py-3 md:py-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="w-10 sm:w-12 md:w-16 px-1.5 sm:px-2 md:px-4 py-3 md:py-6 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cart.map(item => (
                <tr key={item.id} className="h-auto md:h-[90px]">
                  <td className="px-3 sm:px-4 md:px-10 py-2.5 sm:py-3 md:py-4">
                    <p className="font-bold text-slate-800 uppercase tracking-tight text-[11px] sm:text-xs md:text-sm line-clamp-1">{item.name}</p>
                    <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.brand}</p>
                  </td>
                  <td className="w-14 sm:w-16 md:w-24 px-1.5 sm:px-2 md:px-4 py-2.5 sm:py-3 md:py-4 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity === 0 ? '' : item.quantity}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCart(prev => prev.map(ci =>
                          ci.id === item.id ? { ...ci, quantity: raw === '' ? 0 : parseInt(raw) || 0 } : ci
                        ));
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      onBlur={() => updateQuantity(item.id, item.quantity)}
                      className="w-12 sm:w-14 md:w-16 text-center font-bold text-slate-700 bg-slate-50/50 rounded-lg py-1 md:py-2 border-none outline-none focus:ring-2 focus:ring-primary/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all tabular-nums text-[11px] sm:text-xs md:text-sm"
                    />
                  </td>
                  <td className="hidden sm:table-cell w-28 md:w-32 px-2 md:px-4 py-2.5 sm:py-3 md:py-4 text-right font-bold text-slate-500 whitespace-nowrap tabular-nums text-xs md:text-sm">{formatCurrency(item.base_price * item.quantity)}</td>
                  <td className="hidden sm:table-cell w-24 md:w-32 px-2 md:px-4 py-2.5 sm:py-3 md:py-4 text-right font-bold text-slate-500 whitespace-nowrap tabular-nums text-xs md:text-sm">{formatCurrency(item.base_price * (item.tax_percentage / 100) * item.quantity)}</td>
                  <td className="w-24 sm:w-28 md:w-40 px-3 sm:px-4 md:px-10 py-2.5 sm:py-3 md:py-4 text-right font-black text-slate-900 whitespace-nowrap tabular-nums text-[11px] sm:text-xs md:text-sm">{formatCurrency(item.base_price * (1 + item.tax_percentage/100) * item.quantity)}</td>
                  <td className="w-10 sm:w-12 md:w-16 px-1.5 sm:px-2 md:px-4 py-2.5 sm:py-3 md:py-4 text-center no-print">
                    <button onClick={() => removeFromCart(item.id)} className="p-1 md:p-2 text-slate-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="p-4 sm:p-5 md:p-10 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12 border-t border-slate-100">
          <div className="max-w-md">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-wider">
              {docType === 'quote' ? 'Vigencia de 8 días. Precios incluyen IVA.' : 'Factura de venta legal.'}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para la factura (despacho, cobro al recibir, etc.)"
              rows={3}
              className="no-print mt-3 w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
            />
            {notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notas</p>
                <p className="text-xs font-medium text-slate-600 whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal (sin IVA)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>IVA ({effectiveIvaRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="pt-4 md:pt-6 border-t border-slate-200 flex justify-between items-end">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</span>
              <span className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(total)}</span>
            </div>
            <div className="pt-6 md:pt-8 flex flex-col sm:flex-row gap-3 no-print">
              {docType === 'sale' ? (
                <button 
                  onClick={handleCheckout} 
                  disabled={cart.length === 0 || processing} 
                  className="flex-1 py-5 bg-[#e2e8f0] text-black border border-[#cbd5e1] rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all shadow-sm disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} {processing ? 'Guardando...' : 'Facturar'}
                </button>
              ) : (
                <>
                  <button onClick={handlePrint} disabled={cart.length === 0} className="flex-1 py-5 bg-white border border-slate-200 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Printer className="w-4 h-4" /> Imprimir</button>
                  <button disabled={cart.length === 0} className="flex-1 py-5 bg-primary rounded-[24px] font-black text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"><Save className="w-4 h-4" /> Guardar</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
