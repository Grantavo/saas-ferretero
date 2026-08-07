'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setLoading(true);

    try {
      // El parsing y la inserción ocurren en el servidor
      // (src/app/api/dashboard/inventory/import/route.ts), donde el
      // tenant se deriva de la sesión autenticada y nunca se confía
      // en valores enviados por el cliente.
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/dashboard/inventory/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar el archivo.');
      } else {
        setResult({ success: data.success, errors: data.errors });
      }
    } catch (err: any) {
      setError('Error al procesar el archivo: ' + (err?.message || 'error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link 
        href="/dashboard/inventory" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inventario
      </Link>

      <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-xl text-center space-y-8">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-emerald-100 w-20 h-20 rounded-[30%] flex items-center justify-center mx-auto text-emerald-600">
            <FileSpreadsheet className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Importación Masiva</h1>
          <p className="text-muted-foreground">Sube tu archivo Excel o CSV para cargar miles de productos en segundos.</p>
        </div>

        {!result ? (
          <div className="max-w-xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-6 bg-slate-50 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Info className="w-4 h-4" /> Formato requerido
                </div>
                <ul className="text-xs text-slate-500 space-y-2">
                  <li>• Columnas: <strong>nombre, precio_base, iva, stock</strong></li>
                  <li>• Opcionales: marca, categoria, codigo_barras, sku</li>
                  <li>• Formato: .xlsx, .xls o .csv</li>
                </ul>
              </div>
              <div className="p-6 bg-blue-50 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-700">
                  <CheckCircle2 className="w-4 h-4" /> Recomendación
                </div>
                <p className="text-xs text-blue-600/80 leading-relaxed">
                  Asegúrate de que los encabezados del Excel coincidan con los nombres sugeridos para una carga perfecta.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 justify-center text-red-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={loading}
              />
              <div className="border-4 border-dashed border-slate-100 rounded-[40px] p-16 transition-all group-hover:border-primary/20 group-hover:bg-slate-50/50 flex flex-col items-center gap-4">
                {loading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="font-bold text-slate-600">Procesando {fileName}...</p>
                  </>
                ) : (
                  <>
                    <div className="bg-primary/10 p-5 rounded-full text-primary">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">Haz clic o arrastra tu archivo aquí</p>
                      <p className="text-sm text-muted-foreground mt-1">Máximo 5000 productos por carga</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto p-8 rounded-3xl bg-slate-50 space-y-6"
          >
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">{result.success}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Cargados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-500">{result.errors}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Errores</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/inventory" className="w-full bg-primary text-white py-4 rounded-2xl font-bold">
                Ver Inventario
              </Link>
              <button onClick={() => setResult(null)} className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold">
                Cargar otro archivo
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
