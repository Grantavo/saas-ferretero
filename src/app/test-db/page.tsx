'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function TestConnection() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [message, setMessage] = useState('Probando conexión...');

  useEffect(() => {
    async function test() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase.from('tenants').select('*').limit(1);
        if (error) throw error;
        setStatus('success');
        setMessage('¡Conexión exitosa! La base de datos respondió correctamente.');
      } catch (err: any) {
        setStatus('error');
        setMessage('Error de conexión: ' + err.message);
      }
    }
    test();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className={`p-8 rounded-3xl shadow-xl max-w-md w-full text-center ${
        status === 'success' ? 'bg-emerald-50 border-2 border-emerald-200' : 
        status === 'error' ? 'bg-red-50 border-2 border-red-200' : 'bg-white'
      }`}>
        <h1 className="text-2xl font-bold mb-4">Prueba de Conexión</h1>
        <p className={`font-medium ${
          status === 'success' ? 'text-emerald-700' : 
          status === 'error' ? 'text-red-700' : 'text-slate-600'
        }`}>{message}</p>
        
        {status === 'success' && (
          <div className="mt-6">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-emerald-600">Ahora podemos proceder a crear tu primer Tenant (Ferretería).</p>
          </div>
        )}
      </div>
    </div>
  );
}
