'use client';

import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Package,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error: any) {
        console.error('Error fetching products:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus productos y niveles de stock reales.</p>
        </div>
        <Link 
          href="/dashboard/inventory/new"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Producto
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
          <Filter className="w-5 h-5" /> Filtros
        </button>
      </div>

      {/* Products Gallery (Grid) */}
      <div className="">
        {loading ? (
          <div className="bg-white rounded-[40px] border border-slate-100 p-20 flex flex-col items-center justify-center text-muted-foreground shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-black uppercase tracking-widest text-[10px]">Cargando Catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[40px] border border-slate-100 p-20 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Package className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No se encontraron productos</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Prueba con otro término de búsqueda o crea un producto nuevo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product, i) => {
              const priceWithTax = Number(product.base_price) * (1 + product.tax_percentage / 100);
              
              return (
                <motion.div 
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.01 }}
                  className="group relative bg-white p-8 pb-6 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2"
                >
                  {/* Icono Centrado (Imagen Real o Backup) */}
                  <div className="w-20 h-20 bg-white rounded-[24px] shadow-md border border-slate-50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-200" />
                    )}
                  </div>

                  {/* Textos Centrados */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {product.brand || 'GENERAL'}
                    </p>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {product.name}
                    </h3>
                    {/* Stock Info (Añadido quirúrgicamente) */}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= product.min_stock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Stock: <span className="text-slate-900">{product.stock}</span>
                      </p>
                    </div>
                    {/* Precio Visible (Añadido quirúrgicamente) */}
                    <p className="text-sm font-black text-primary mt-2">
                      {formatCurrency(priceWithTax)}
                    </p>
                  </div>

                  {/* Accion Editar (Fijo arriba a la derecha) */}
                  <div className="absolute top-4 right-4">
                    <Link 
                      href={`/dashboard/inventory/edit/${product.id}`}
                      className="p-3 bg-white rounded-2xl shadow-lg border border-slate-50 text-slate-400 hover:text-primary transition-all flex items-center justify-center hover:scale-110"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* Footer info */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-12 flex justify-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] px-8 py-3 rounded-full border border-slate-50">
              GrupoJenta SaaS • {filteredProducts.length} Artículos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
