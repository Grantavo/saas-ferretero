'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Package, 
  Tag, 
  DollarSign, 
  Image as ImageIcon, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    cost_price: 0,
    stock: 0,
    margin_percentage: 30,
    tax_percentage: 19,
    base_price: 0
  });

  const supabase = createClient();

  // Calcular precio base automáticamente
  useEffect(() => {
    const cost = Number(formData.cost_price) || 0;
    const margin = Number(formData.margin_percentage) || 0;
    const price = cost * (1 + margin / 100);
    setFormData(prev => ({ ...prev, base_price: Math.round(price) }));
  }, [formData.cost_price, formData.margin_percentage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let image_url = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      const { error } = await supabase
        .from('products')
        .insert([{ 
          ...formData, 
          image_url,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Producto creado con éxito');
      router.push('/dashboard/inventory');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/inventory"
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Producto 2026</h1>
            <p className="text-slate-500 font-medium">Completa la información para el catálogo.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6">
            <div className="w-full aspect-square bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative group">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-8">Sube la foto del producto</p>
                </>
              )}
              <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/80 backdrop-blur-sm transition-all text-xs font-black uppercase tracking-widest text-primary">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                Cambiar Imagen
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-primary font-bold mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-widest text-xs font-black">Información Básica</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Producto</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold uppercase"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Marca</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-emerald-600 font-bold mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-widest text-xs font-black">Finanzas e Inventario</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Costo Unitario (Sin IVA)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="number" 
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-slate-700"
                    value={formData.cost_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Stock Inicial</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-orange-600"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Margen de Utilidad (%)</label>
                <div className="relative">
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    className="w-full pl-6 pr-10 py-4 bg-emerald-50/50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-black text-emerald-700"
                    value={formData.margin_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, margin_percentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Precio Sugerido (Con IVA)</label>
                <div className="w-full px-6 py-4 bg-slate-900 rounded-2xl text-white font-black text-xl flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Final</span>
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(formData.base_price * (1 + formData.tax_percentage/100))}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-primary text-white rounded-[32px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            Guardar Producto
          </button>
        </div>
      </form>
    </div>
  );
}
