'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Barcode, 
  DollarSign, 
  Save,
  Loader2,
  Tag,
  Warehouse
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    barcode: '',
    sku: '',
    cost_price: '' as any,
    margin_percentage: 30 as any,
    base_price: '' as any,
    tax_percentage: 19,
    stock: '' as any,
    min_stock: '' as any,
  });

  const [taxAmount, setTaxAmount] = useState(0);
  const [totalWithTax, setTotalWithTax] = useState(0);

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Funciones de cálculo bidireccional ... (se mantienen igual)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
      if (!tenant) throw new Error('No se encontró una ferretería configurada.');

      let image_url = null;
      if (image) {
        setUploadingImage(true);
        image_url = await uploadImage(image);
      }

      const { error } = await supabase.from('products').insert([
        { 
          ...formData, 
          image_url,
          cost_price: parseFloat(formData.cost_price) || 0,
          margin_percentage: parseFloat(formData.margin_percentage) || 0,
          base_price: parseFloat(formData.base_price) || 0,
          stock: parseInt(formData.stock) || 0,
          min_stock: parseInt(formData.min_stock) || 0,
          tenant_id: tenant.id 
        }
      ]);

      if (error) throw error;
      toast.success('¡Producto creado exitosamente!');
      router.push('/dashboard/inventory');
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // ... (handleNameChange, handleBrandChange, handleCategoryChange se mantienen igual)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link 
        href="/dashboard/inventory" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inventario
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Nuevo Producto</h1>
          <p className="text-muted-foreground mt-1">Completa la ficha técnica del artículo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-8 space-y-6">
          {/* Card de Imagen */}
          <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 text-primary font-bold mb-6">
              <Package className="w-5 h-5" /> Imagen del Producto
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 items-center">
              <div className="relative w-48 h-48 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Sin Foto</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  <span className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Cambiar</span>
                </label>
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sube una fotografía real</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Las fotos reales ayudan a identificar los productos más rápido en el punto de venta. Formatos recomendados: JPG, PNG o WebP.
                </p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl font-bold text-xs cursor-pointer hover:bg-slate-200 transition-all uppercase tracking-widest">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  Seleccionar Archivo
                </label>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <Package className="w-5 h-5" /> Información General
            </div>
            
            {/* ... Resto del formulario igual ... */}
            
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1">Nombre del Producto</label>
              <input 
                required
                type="text" 
                placeholder="SOLO LETRAS"
                className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Marca</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Categoría</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Código de Barras (EAN)</label>
                <div className="relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">SKU / Referencia</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <Warehouse className="w-5 h-5" /> Inventario y Stock
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Stock Inicial</label>
                <input 
                  type="number" 
                  className={inputNumberClass}
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Stock Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  className={inputNumberClass}
                  value={formData.min_stock}
                  onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white rounded-[32px] text-slate-900 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-2 font-bold mb-4 text-primary">
              <DollarSign className="w-5 h-5" /> Precios e Impuestos
            </div>

            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-100">
              <div className="flex flex-col justify-end gap-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1 whitespace-nowrap">Costo (Sin IVA)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 group-focus-within:text-primary transition-colors">$</div>
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) => handleCostChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1 whitespace-nowrap">Rentabilidad (%)</label>
                <div className="relative group">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-emerald-400 group-focus-within:text-emerald-600 transition-colors">%</div>
                  <input 
                    type="number" 
                    className="w-full pl-4 pr-10 py-4 bg-emerald-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-black text-emerald-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="30"
                    value={formData.margin_percentage}
                    onChange={(e) => handleMarginChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Precio Base (Venta Sin IVA)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">$</span>
                <input 
                  required
                  type="number" 
                  className="w-full pl-8 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-xl text-slate-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  value={formData.base_price}
                  onChange={(e) => handleBasePriceChange(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tarifa IVA</label>
                <select 
                  className="w-full px-3 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold text-sm text-slate-700"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({...formData, tax_percentage: parseInt(e.target.value)})}
                >
                  <option value="19">19%</option>
                  <option value="5">5%</option>
                  <option value="0">0%</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Valor IVA</label>
                <div className="px-3 py-3 bg-primary/5 rounded-xl font-black text-sm text-primary">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(taxAmount)}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-500 mb-1">Precio Final (Venta)</p>
              <p className="text-4xl font-black text-primary">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalWithTax)}
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#e2e8f0] text-black border border-[#cbd5e1] py-4 rounded-2xl font-normal text-lg hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
