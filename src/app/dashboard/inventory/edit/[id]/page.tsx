'use client';

import { useState, useEffect, use } from 'react';
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
  Warehouse,
  X,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    barcode: '',
    sku: '',
    cost_price: '' as any,
    margin_percentage: '' as any,
    base_price: '' as any,
    tax_percentage: 19,
    stock: '' as any,
    min_stock: '' as any,
    image_url: null as string | null
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalWithTax, setTotalWithTax] = useState(0);

  // Cargar datos del producto
  useEffect(() => {
    async function fetchProduct() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            ...data,
            cost_price: data.cost_price?.toString() || '',
            margin_percentage: data.margin_percentage?.toString() || '',
            base_price: data.base_price?.toString() || '',
            stock: data.stock?.toString() || '',
            min_stock: data.min_stock?.toString() || '',
          });
          setImagePreview(data.image_url);
        }
      } catch (error: any) {
        toast.error('Error al cargar producto: ' + error.message);
        router.push('/dashboard/inventory');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.id]);

  // Cálculos de precios (igual que en NewProductPage)
  const handleCostChange = (val: string) => {
    const cost = parseFloat(val);
    const margin = parseFloat(formData.margin_percentage) || 0;
    let base = formData.base_price;
    if (!isNaN(cost)) {
      const denominator = 1 - (margin / 100);
      base = denominator > 0 ? Math.round(cost / denominator) : cost;
    }
    setFormData({ ...formData, cost_price: val, base_price: isNaN(cost) ? '' : base.toString() });
  };

  const handleMarginChange = (val: string) => {
    const margin = parseFloat(val);
    const cost = parseFloat(formData.cost_price) || 0;
    let base = formData.base_price;
    if (!isNaN(margin) && cost > 0) {
      const denominator = 1 - (margin / 100);
      base = denominator > 0 ? Math.round(cost / denominator) : cost;
    }
    setFormData({ ...formData, margin_percentage: val, base_price: (!isNaN(margin) && cost > 0) ? base.toString() : base });
  };

  const handleBasePriceChange = (val: string) => {
    const base = parseFloat(val);
    const cost = parseFloat(formData.cost_price) || 0;
    let margin = formData.margin_percentage;
    if (!isNaN(base) && base > 0 && cost > 0) {
      margin = Math.round((1 - (cost / base)) * 100);
    }
    setFormData({ ...formData, base_price: val, margin_percentage: (!isNaN(base) && cost > 0) ? margin.toString() : margin });
  };

  useEffect(() => {
    const base = parseFloat(formData.base_price) || 0;
    const calculatedTax = base * (formData.tax_percentage / 100);
    setTaxAmount(calculatedTax);
    setTotalWithTax(base + calculatedTax);
  }, [formData.base_price, formData.tax_percentage]);

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
    // Usar el ID del producto para que el archivo sea rastreable y único
    const fileName = `${resolvedParams.id}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    console.log('Iniciando subida a Storage:', filePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Sobreescribir si existe
      });

    if (uploadError) {
      console.error('Error real de Supabase Storage:', uploadError);
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    console.log('Subida exitosa, obteniendo URL pública...');
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('No se pudo generar la URL pública de la imagen.');
    }

    console.log('URL Generada:', data.publicUrl);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    try {
      let final_image_url = formData.image_url;
      
      if (image) {
        setUploadingImage(true);
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          final_image_url = uploadedUrl;
        }
      }

      console.log('Enviando a base de datos con URL:', final_image_url);

      const { data: updateData, error: updateError } = await supabase
        .from('products')
        .update({ 
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          barcode: formData.barcode,
          sku: formData.sku,
          image_url: final_image_url,
          cost_price: parseFloat(formData.cost_price) || 0,
          margin_percentage: parseFloat(formData.margin_percentage) || 0,
          base_price: parseFloat(formData.base_price) || 0,
          stock: parseInt(formData.stock) || 0,
          min_stock: parseInt(formData.min_stock) || 0,
        })
        .eq('id', resolvedParams.id)
        .select(); // Forzar devolución de datos para confirmar guardado

      if (updateError) {
        console.error('ERROR CRÍTICO DE BASE DE DATOS:', updateError);
        toast.error(`Error de Base de Datos: ${updateError.message} (Código: ${updateError.code})`);
        throw updateError;
      }

      console.log('DATOS CONFIRMADOS POR SUPABASE:', updateData);
      
      if (!updateData || updateData.length === 0) {
        toast.error('Supabase no encontró el producto para actualizar.');
        throw new Error('No se actualizó ninguna fila.');
      }

      toast.success('¡Producto y foto actualizados exitosamente!');
      router.push('/dashboard/inventory');
      router.refresh(); 
    } catch (error: any) {
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="font-black uppercase tracking-widest text-xs">Cargando datos del producto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver al inventario
      </Link>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight uppercase">Editar Producto</h1>
          <p className="text-muted-foreground mt-1">Modifica la información de {formData.name}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        <div className="lg:col-span-8 space-y-6">
          {/* Card de Imagen */}
          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 text-primary font-bold mb-6 uppercase tracking-widest text-xs">
              <Package className="w-5 h-5" /> Imagen del Producto
            </div>
            
            <div className="flex flex-col sm:flex-row gap-8 items-center">
              <div className="relative w-48 h-48 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin Foto</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  <span className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Cambiar Foto</span>
                </label>
              </div>
              <div className="flex-1 space-y-4 text-center sm:text-left">
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Actualiza la visual</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Sube una nueva foto si el empaque o la presentación del producto ha cambiado.</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl font-bold text-xs cursor-pointer hover:bg-slate-200 transition-all uppercase tracking-widest">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  Seleccionar Nueva Imagen
                </label>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-widest text-xs">
              <Package className="w-5 h-5" /> Información General
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre del Producto</label>
              <input 
                required type="text"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Marca</label>
                <input 
                  type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Categoría</label>
                <input 
                  type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all uppercase"
                  value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Código de Barras</label>
                <input 
                  type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">SKU / Referencia</label>
                <input 
                  type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold mb-2 uppercase tracking-widest text-xs">
              <Warehouse className="w-5 h-5" /> Inventario
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Stock Actual</label>
                <input 
                  type="number" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mínimo Alerta</label>
                <input 
                  type="number" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 sticky top-24 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-2 font-bold mb-4 text-primary uppercase tracking-widest text-xs">
              <DollarSign className="w-5 h-5" /> Finanzas
            </div>

            <div className="grid grid-cols-1 gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Unitario (Sin IVA)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">$</span>
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) => handleCostChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentabilidad (%)</label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-emerald-400">%</span>
                  <input 
                    type="number" 
                    className="w-full pl-4 pr-10 py-4 bg-emerald-50/50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-black text-emerald-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="30"
                    value={formData.margin_percentage}
                    onChange={(e) => handleMarginChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Final con IVA</label>
              <p className="text-4xl font-black text-primary tracking-tighter">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalWithTax)}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Incluye {formData.tax_percentage}% IVA</p>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-[#e2e8f0] text-black border border-[#cbd5e1] py-5 rounded-2xl font-normal text-lg hover:bg-white transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 mt-4"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {saving ? 'Guardando...' : 'Actualizar Producto'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
