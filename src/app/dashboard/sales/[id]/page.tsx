'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, FileText, Loader2, Package, Printer } from 'lucide-react';

export default function SaleDetailPage() {
  const params = useParams();
  const saleId = params.id as string;

  const [sale, setSale] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchSale() {
      try {
        const [saleRes, itemsRes] = await Promise.all([
          supabase.from('sales').select('*').eq('id', saleId).single(),
          supabase.from('sale_items').select('*').eq('sale_id', saleId),
        ]);

        if (saleRes.error) throw saleRes.error;
        setSale(saleRes.data);

        if (!itemsRes.error && itemsRes.data) {
          const productIds = itemsRes.data.map(i => i.product_id);
          const prodRes = await supabase.from('products').select('id, name, brand').in('id', productIds);
          const productMap = new Map((prodRes.data ?? []).map(p => [p.id, p]));
          setItems(itemsRes.data.map(i => ({ ...i, product: productMap.get(i.product_id) })));
        }

        if (saleRes.data?.seller_id) {
          const sellerRes = await supabase.from('profiles').select('full_name').eq('id', saleRes.data.seller_id).maybeSingle();
          if (!sellerRes.error && sellerRes.data) setSellerName(sellerRes.data.full_name);
        }
      } catch {
        setSale(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSale();
  }, [saleId]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="font-bold text-slate-500">Cargando factura...</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
          <FileText className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold">Factura no encontrada</h3>
        <Link href="/dashboard/sales" className="text-sm font-bold text-primary hover:underline">
          Volver a Ventas
        </Link>
      </div>
    );
  }

  const paymentLabel = (method: string) => {
    const map: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };
    return map[method] || method;
  };

  return (
    <div className="space-y-8 pb-20">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-invoice, .print-invoice * { visibility: visible !important; }
          .print-invoice { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/dashboard/sales" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Volver a Ventas
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Factura #{sale.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            {new Date(sale.created_at).toLocaleString('es-CO')} · {paymentLabel(sale.payment_method)}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm text-xs no-print"
        >
          <Printer className="w-4 h-4 text-slate-500" /> Imprimir Copia
        </button>
      </div>

      <div className="bg-white rounded-[30px] md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden print-invoice">
        <div className="p-5 md:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6 md:gap-10">
          <div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cliente</p>
            {sale.customer_name ? (
              <div className="space-y-0.5">
                <p className="font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">{sale.customer_name}</p>
                {sale.customer_nit && <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-tight">{sale.customer_nit}</p>}
                {sale.customer_address && <p className="text-xs md:text-sm font-medium text-slate-500">{sale.customer_address}</p>}
                {sale.customer_phone && <p className="text-xs md:text-sm font-medium text-slate-500">{sale.customer_phone}</p>}
              </div>
            ) : (
              <p className="font-black text-slate-900 text-base md:text-lg">Cliente no registrado</p>
            )}
          </div>
          <div className="md:text-right">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendedor</p>
            <p className="font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">{sellerName || '—'}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-8 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Marca</th>
                <th className="px-3 md:px-6 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Precio</th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">IVA</th>
                <th className="px-3 md:px-8 py-4 md:py-5 text-[9px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 md:px-8 py-3 md:py-5">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Package className="w-4 h-4 md:w-5 md:h-5 text-slate-300 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs md:text-sm">{item.product?.name || 'Producto eliminado'}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-5 text-xs md:text-sm text-slate-500 font-medium">{item.product?.brand || '—'}</td>
                  <td className="px-3 md:px-6 py-3 md:py-5 text-center text-xs md:text-sm font-bold text-slate-700">{item.quantity}</td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-5 text-right text-xs md:text-sm font-bold text-slate-700 tabular-nums">{formatCurrency(item.unit_base_price)}</td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-5 text-right text-xs md:text-sm font-bold text-slate-500 tabular-nums">{formatCurrency(item.tax_amount)}</td>
                  <td className="px-3 md:px-8 py-3 md:py-5 text-right font-black text-slate-900 text-xs md:text-sm tabular-nums">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sale.notes && (
          <div className="px-5 md:px-10 py-4 md:py-6 border-t border-slate-100 bg-white">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</p>
            <p className="text-xs md:text-sm font-medium text-slate-600 whitespace-pre-wrap">{sale.notes}</p>
          </div>
        )}

        <div className="p-5 md:p-10 bg-slate-50/30 flex justify-end border-t border-slate-100">
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>Subtotal (sin IVA)</span>
              <span>{formatCurrency(sale.total_base)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">
              <span>IVA</span>
              <span>{formatCurrency(sale.total_tax)}</span>
            </div>
            <div className="pt-4 md:pt-6 border-t border-slate-200 flex justify-between items-end">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</span>
              <span className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(sale.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}