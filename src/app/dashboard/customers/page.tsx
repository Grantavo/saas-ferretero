'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Search, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  MoreVertical,
  Loader2,
  X,
  Plus,
  CheckCircle2,
  LayoutGrid,
  Rows3,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CitySelect from '@/components/CitySelect';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [newCustomer, setNewCustomer] = useState({ full_name: '', nit: '', email: '', phone: '', address: '', city: '', credit_limit: '' });
  const [totalsByCustomer, setTotalsByCustomer] = useState<Record<string, { sales_count: number; total_amount: number }>>({});
  const [receivablesByCustomer, setreceivablesByCustomer] = useState<Record<string, { total_due: number; open_invoices: number }>>({});
  const [userRole, setUserRole] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (data) setUserRole(data.role);
    }
    fetchRole();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error) setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotals = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_sales_totals')
        .select('customer_id, sales_count, total_amount');

      if (!error) {
        const map: Record<string, { sales_count: number; total_amount: number }> = {};
        (data || []).forEach(t => {
          map[t.customer_id] = { sales_count: Number(t.sales_count) || 0, total_amount: Number(t.total_amount) || 0 };
        });
        setTotalsByCustomer(map);
      }
    } catch (error) {
      console.error('Error fetching customer totals:', error);
    }
  };

  const fetchReceivables = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_receivables')
        .select('customer_id, credit_limit, total_due, open_invoices');

      if (!error) {
        const map: Record<string, { total_due: number; open_invoices: number }> = {};
        (data || []).forEach(r => {
          if (r.customer_id) {
            map[r.customer_id] = { total_due: Number(r.total_due) || 0, open_invoices: Number(r.open_invoices) || 0 };
          }
        });
        setreceivablesByCustomer(map);
      }
    } catch (error) {
      console.error('Error fetching receivables:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchTotals();
    fetchReceivables();
  }, []);

  const openNewCustomer = () => {
    setEditingCustomer(null);
    setNewCustomer({ full_name: '', nit: '', email: '', phone: '', address: '', city: '', credit_limit: '' });
    setShowModal(true);
  };

  const openEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setNewCustomer({
      full_name: customer.full_name || '',
      nit: customer.nit || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      credit_limit: customer.credit_limit != null ? String(customer.credit_limit) : '',
    });
    setShowModal(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            full_name: newCustomer.full_name,
            nit: newCustomer.nit,
            email: newCustomer.email,
            phone: newCustomer.phone,
            address: newCustomer.address,
            city: newCustomer.city,
            credit_limit: newCustomer.credit_limit === '' ? 0 : Number(newCustomer.credit_limit),
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast.success('Cliente actualizado exitosamente');
      } else {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
        const { error } = await supabase
          .from('customers')
          .insert([{ 
            full_name: newCustomer.full_name,
            nit: newCustomer.nit, // Asegúrate de que esta columna exista en Supabase o cámbiala a id_number
            email: newCustomer.email,
            phone: newCustomer.phone,
            address: newCustomer.address,
            city: newCustomer.city,
            credit_limit: newCustomer.credit_limit === '' ? 0 : Number(newCustomer.credit_limit),
            tenant_id: tenant?.id 
          }]);

        if (error) throw error;
        toast.success('Cliente creado exitosamente');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setNewCustomer({ full_name: '', nit: '', email: '', phone: '', address: '', city: '', credit_limit: '' });
      fetchCustomers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nit && c.nit.includes(searchTerm))
  );

  const canEdit = userRole === 'admin';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Directorio de Clientes</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Gestiona los perfiles y datos de contacto de tus clientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
            <button
              onClick={() => setView('cards')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'cards' ? "bg-white text-primary shadow-sm" : "text-slate-400"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Tarjetas
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'list' ? "bg-white text-primary shadow-sm" : "text-slate-400"
              )}
            >
              <Rows3 className="w-4 h-4" />
              Lista
            </button>
          </div>
          <button 
            onClick={openNewCustomer}
            className="bg-[#e2e8f0] text-black border border-[#cbd5e1] px-6 py-4 rounded-2xl font-normal text-sm hover:bg-white transition-all flex items-center gap-2 shadow-sm group"
          >
            <motion.div
              whileHover={{ y: -2, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <UserPlus className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
            </motion.div>
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o NIT..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {view === 'cards' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-bold text-slate-400 tracking-tight">Cargando directorio...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
             <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-slate-800">No hay clientes aún</h3>
             <p className="text-sm text-slate-500">Agrega tu primer cliente para empezar a registrar sus ventas.</p>
          </div>
        ) : (
          filteredCustomers.map((customer, i) => (
            <motion.div 
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
            >
              {canEdit && (
                <button
                  onClick={() => openEditCustomer(customer)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-primary hover:bg-slate-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Editar cliente"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 text-2xl font-black border border-slate-100">
                  {customer.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 line-clamp-1 text-lg">{customer.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">NIT/CC</span>
                    <p className="text-xs text-slate-500 font-bold">{customer.nit || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                {customer.email && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <Mail className="w-4 h-4 text-slate-300" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <Phone className="w-4 h-4 text-slate-300" />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    {[customer.address, customer.city].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center opacity-70">
                <div className="text-center flex-1 border-r border-slate-50">
                  <p className="text-sm font-black text-slate-900">{totalsByCustomer[customer.id]?.sales_count ?? 0}</p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Ventas</p>
                </div>
                <div className="text-center flex-1 border-r border-slate-50">
                  <p className={cn("text-sm font-black", (totalsByCustomer[customer.id]?.total_amount ?? 0) > 0 ? "text-emerald-600" : "text-slate-900")}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalsByCustomer[customer.id]?.total_amount ?? 0)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Facturado</p>
                </div>
                <div className="text-center flex-1">
                  <p className={cn("text-sm font-black", (receivablesByCustomer[customer.id]?.total_due ?? 0) > 0 ? "text-amber-600" : "text-slate-900")}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(receivablesByCustomer[customer.id]?.total_due ?? 0)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Por Cobrar</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      ) : (
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-bold text-slate-400 tracking-tight">Cargando directorio...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <User className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Sin clientes registrados</h3>
            <p className="text-muted-foreground text-sm">Agrega tu primer cliente para empezar a registrar sus ventas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">NIT/CC</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Dirección</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.map(customer => (
                  <motion.tr 
                    key={customer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 font-black border border-slate-100 shrink-0">
                          {customer.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{customer.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-500">{customer.nit || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-0.5">
                        {customer.email && <p className="text-sm font-medium text-slate-600">{customer.email}</p>}
                        {customer.phone && <p className="text-sm font-bold text-slate-500">{customer.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-slate-500">{[customer.address, customer.city].filter(Boolean).join(', ') || '—'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-center">
                        {canEdit && (
                        <button
                          onClick={() => openEditCustomer(customer)}
                          className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 text-slate-400 hover:text-primary transition-all"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Modal de Nuevo Cliente */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-4 shrink-0">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="mt-6 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo / Razón Social</label>
                  <input 
                    required type="text" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                    value={newCustomer.full_name} 
                    onChange={e => {
                      const val = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, "");
                      // Proper Case: Primera letra de cada palabra en Mayúscula
                      const formatted = val.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
                      setNewCustomer({...newCustomer, full_name: formatted});
                    }} 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT / CC</label>
                    <input 
                      required type="text" 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={newCustomer.nit} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setNewCustomer({...newCustomer, nit: val});
                      }} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Límite de Crédito (COP)</label>
                    <input 
                      type="text" inputMode="numeric"
                      placeholder="$0.00 = sin crédito"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={newCustomer.credit_limit ? `$${Number(newCustomer.credit_limit).toLocaleString('es-CO')}` : ''} 
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setNewCustomer({...newCustomer, credit_limit: val.slice(0, 15)});
                      }} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono / Celular</label>
                    <input 
                      type="text" inputMode="tel" maxLength={10}
                      placeholder="3xx xxx xxxx"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={newCustomer.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setNewCustomer({...newCustomer, phone: val.slice(0, 10)});
                      }} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                      value={newCustomer.email} 
                      onChange={e => setNewCustomer({...newCustomer, email: e.target.value.toLowerCase()})} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                    value={newCustomer.address} 
                    onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                  <CitySelect
                    value={newCustomer.city}
                    onChange={city => setNewCustomer({...newCustomer, city})}
                  />
                </div>
                <button type="submit" disabled={saving} className="w-full bg-[#e2e8f0] text-black border border-[#cbd5e1] py-5 rounded-2xl font-normal text-lg hover:bg-white transition-all shadow-sm disabled:opacity-50 sticky bottom-0">
                  {saving ? 'Guardando...' : editingCustomer ? 'Guardar Cambios' : 'Crear Perfil de Cliente'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
