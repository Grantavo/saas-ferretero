'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  CreditCard, 
  History, 
  MessagesSquare, 
  Calendar, 
  ClipboardList, 
  Settings,
  ToggleLeft,
  ToggleRight,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  Save,
  Key,
  UserCog,
  Trash2,
  Shield,
  Pencil,
  Info,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

const moduleIcons: Record<string, any> = {
  inventory: Package,
  pos: ShoppingCart,
  sales: BarChart3,
  customers: Users,
  payments: CreditCard,
  history: History,
  chat: MessagesSquare,
  calendar: Calendar,
  tasks: ClipboardList,
  settings: Settings,
};

const moduleColors: Record<string, string> = {
  inventory: 'from-orange-500 to-amber-500',
  pos: 'from-emerald-500 to-teal-500',
  sales: 'from-blue-500 to-cyan-500',
  customers: 'from-indigo-500 to-violet-500',
  payments: 'from-purple-500 to-pink-500',
  history: 'from-slate-500 to-slate-600',
  chat: 'from-amber-500 to-orange-500',
  calendar: 'from-rose-500 to-pink-500',
  tasks: 'from-teal-500 to-cyan-500',
  settings: 'from-slate-400 to-slate-500',
};

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Tenant Info Editing
  const [editingTenant, setEditingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({ name: '', nit: '', address: '', phone: '' });
  const [savingTenant, setSavingTenant] = useState(false);

  // States for Adding User
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'admin' });
  const [savingUser, setSavingUser] = useState(false);

  // States for Changing Password/Email/Role
  const [userEditModal, setUserEditModal] = useState({ isOpen: false, userId: '', userName: '', userEmail: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [showUserCredentials, setShowUserCredentials] = useState(false);
  const [userDeleteConfirm, setUserDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // States for Role Permissions
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [savingPerm, setSavingPerm] = useState(false);

  // Tab navigation
  const [currentTab, setCurrentTab] = useState<'info' | 'modules' | 'users' | 'permissions'>('info');

  const tabs = [
    { key: 'info' as const, label: 'Información', icon: Info },
    { key: 'modules' as const, label: 'Aplicaciones', icon: Package },
    { key: 'users' as const, label: 'Usuarios', icon: Users },
    { key: 'permissions' as const, label: 'Permisos', icon: Shield },
  ];

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [tenantRes, modulesRes, usersRes, permsRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('tenant_modules').select('*').eq('tenant_id', tenantId).order('module_name'),
      supabase.from('profiles').select('*').eq('tenant_id', tenantId),
      supabase.from('role_permissions').select('*').eq('tenant_id', tenantId),
    ]);

    if (tenantRes.data) {
      setTenant(tenantRes.data);
      setTenantForm({
        name: tenantRes.data.name || '',
        nit: tenantRes.data.nit || '',
        address: tenantRes.data.address || '',
        phone: tenantRes.data.phone || ''
      });
    }
    if (modulesRes.data) setModules(modulesRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    if (permsRes.data) setRolePermissions(permsRes.data);
    setLoading(false);
  }

  const toggleModule = async (moduleId: string, currentState: boolean) => {
    await supabase
      .from('tenant_modules')
      .update({ is_active: !currentState })
      .eq('id', moduleId);
    
    setModules(modules.map(m => 
      m.id === moduleId ? { ...m, is_active: !currentState } : m
    ));
  };

  const togglePermission = async (role: string, moduleKey: string, currentState: boolean) => {
    const existingPerm = rolePermissions.find(p => p.role === role && p.module_key === moduleKey);

    if (existingPerm) {
      await supabase
        .from('role_permissions')
        .update({ can_access: !currentState })
        .eq('id', existingPerm.id);

      setRolePermissions(rolePermissions.map(p =>
        p.id === existingPerm.id ? { ...p, can_access: !currentState } : p
      ));
    } else {
      const { data } = await supabase
        .from('role_permissions')
        .insert({ tenant_id: tenantId, role, module_key: moduleKey, can_access: true })
        .select()
        .single();

      if (data) {
        setRolePermissions([...rolePermissions, data]);
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, tenant_id: tenantId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

      setShowUserCredentials(true);
      setShowAddUser(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'admin' });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
      console.error('[create-user-detail] Error:', error);
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveTenant = async () => {
    setSavingTenant(true);
    try {
      const { error } = await supabase.from('tenants').update(tenantForm).eq('id', tenantId);
      if (error) throw error;
      setTenant({ ...tenant, ...tenantForm });
      setEditingTenant(false);
      toast.success('Datos del negocio guardados');
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    } finally {
      setSavingTenant(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingUser(true);
    try {
      // Update email/password via backend
      if (newPassword || newEmail) {
        const res = await fetch('/api/admin/users/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEditModal.userId, newPassword, newEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario en auth');
      }

      // Update role via profiles table
      if (newRole && newRole !== userEditModal.role) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userEditModal.userId);
        if (error) throw new Error(error.message);
      }
      
      toast.success('Usuario actualizado exitosamente');
      setUserEditModal({ isOpen: false, userId: '', userName: '', userEmail: '', role: '' });
      setNewPassword('');
      setNewEmail('');
      setNewRole('');
      fetchData(); 
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userDeleteConfirm) return;
    const { id: userId, name: userName } = userDeleteConfirm;
    setUserDeleteConfirm(null);

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
      
      toast.success(`Usuario "${userName}" eliminado`);
      fetchData();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  const promptDeleteUser = (id: string, name: string) => {
    setUserDeleteConfirm({ id, name });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link 
        href="/admin/tenants"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a ferreterías
      </Link>

      {/* ============================= */}
      {/* TENANT HERO - Always visible */}
      {/* ============================= */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-violet-50 rounded-[30%] flex items-center justify-center text-violet-600 font-black text-2xl border border-violet-100 shrink-0">
              {tenant?.name?.charAt(0) || 'F'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">{tenant?.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  NIT: {tenant?.nit || 'No registrado'}
                </span>
                <span className="text-slate-200 text-xs">|</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tel: {tenant?.phone || 'No registrado'}
                </span>
                <span className="text-slate-200 text-xs">|</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* TAB BAR */}
      {/* ============================= */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-1.5 flex gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                currentTab === tab.key
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================= */}
      {/* TAB CONTENT */}
      {/* ============================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        >
          {/* ---------- INFO TAB ---------- */}
          {currentTab === 'info' && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Info className="w-5 h-5 text-violet-600" /> Información del Negocio
                </h2>
                {!editingTenant && (
                  <button
                    onClick={() => setEditingTenant(true)}
                    className="px-4 py-2 bg-white text-slate-500 text-xs font-black uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                )}
              </div>

              {editingTenant ? (
                <div className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={tenantForm.name}
                        onChange={e => setTenantForm({...tenantForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIT</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={tenantForm.nit}
                        onChange={e => setTenantForm({...tenantForm, nit: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={tenantForm.phone}
                        onChange={e => setTenantForm({...tenantForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 transition-all"
                        value={tenantForm.address}
                        onChange={e => setTenantForm({...tenantForm, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => { setEditingTenant(false); setTenantForm({ name: tenant?.name || '', nit: tenant?.nit || '', address: tenant?.address || '', phone: tenant?.phone || '' }); }}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveTenant}
                      disabled={savingTenant}
                      className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingTenant ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar Cambios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Comercial</p>
                      <p className="font-bold text-slate-800">{tenant?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIT</p>
                      <p className="font-bold text-slate-800">{tenant?.nit || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                      <p className="font-bold text-slate-800">{tenant?.phone || 'No registrado'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección</p>
                      <p className="font-bold text-slate-800">{tenant?.address || 'No registrada'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de registro</p>
                      <p className="font-bold text-slate-800">{tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- MODULES TAB ---------- */}
          {currentTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-600" /> Aplicaciones
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {modules.filter(m => m.is_active).length} de {modules.length} activas
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.map((mod, i) => {
                  const Icon = moduleIcons[mod.module_key] || Package;
                  const gradient = moduleColors[mod.module_key] || 'from-slate-500 to-slate-600';

                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-[28px] border overflow-hidden transition-all ${
                        mod.is_active ? 'bg-white border-slate-200 shadow-sm hover:shadow-md' : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-[28%] flex items-center justify-center shadow-lg`}>
                            <Icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                          </div>
                          <button
                            onClick={() => toggleModule(mod.id, mod.is_active)}
                            className="transition-all hover:scale-110"
                          >
                            {mod.is_active ? (
                              <ToggleRight className="w-10 h-10 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-10 h-10 text-slate-300" />
                            )}
                          </button>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{mod.module_name}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                            {mod.is_active ? 'Activado' : 'Desactivado'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------- USERS TAB ---------- */}
          {currentTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-600" /> Usuarios ({users.length})
                </h2>
                <button 
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="bg-white border border-slate-200 text-slate-500 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all flex items-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" /> Agregar Usuario
                </button>
              </div>

              {showAddUser && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleAddUser}
                  className="bg-violet-50/50 rounded-[32px] border border-violet-100 p-8 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required type="text" placeholder="Nombre completo"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
                        value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required type="email" placeholder="correo@email.com"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
                        value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required type="password" placeholder="Contraseña temporal"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
                        value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      />
                    </div>
                    <div>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
                        value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      >
                        <option value="admin">Administrador</option>
                        <option value="accounting">Contabilidad</option>
                        <option value="seller">Ventas</option>
                        <option value="warehouse">Bodega</option>
                        <option value="marketing">Mercadeo</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit" disabled={savingUser}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 disabled:opacity-50 shadow-md shadow-violet-500/20"
                  >
                    {savingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingUser ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </motion.form>
              )}

              <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden divide-y divide-slate-50 shadow-sm">
                {users.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                        {user.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{user.full_name || 'Sin nombre'}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {user.role === 'admin' ? 'Administrador' : user.role === 'accounting' ? 'Contabilidad' : user.role === 'seller' ? 'Ventas' : user.role === 'warehouse' ? 'Bodega' : 'Mercadeo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        user.role === 'admin' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {user.role === 'admin' ? 'ADMIN' : user.role === 'accounting' ? 'CONTABILIDAD' : user.role === 'seller' ? 'VENTAS' : user.role === 'warehouse' ? 'BODEGA' : 'MERCADEO'}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            setUserEditModal({ isOpen: true, userId: user.id, userName: user.full_name, userEmail: '', role: user.role });
                            setNewPassword('');
                            setNewEmail('');
                            setNewRole(user.role);
                          }}
                          className="p-2 bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                          title="Editar Usuario"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => promptDeleteUser(user.id, user.full_name)}
                          className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Eliminar Usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="p-12 text-center text-slate-400 font-bold text-sm">
                    No hay usuarios registrados para esta ferretería.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---------- PERMISSIONS TAB ---------- */}
          {currentTab === 'permissions' && (
            (() => {
              const activeModules = modules.filter(m => m.is_active);
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-violet-600" /> Permisos por Rol
                    </h2>
                    {(() => {
                      const totalCells = activeModules.length * 5;
                      const activeCells = activeModules.reduce((acc, m) => {
                        return acc + ['admin', 'accounting', 'seller', 'warehouse', 'marketing'].filter(r =>
                          rolePermissions.find(p => p.role === r && p.module_key === m.module_key)?.can_access
                        ).length;
                      }, 0);
                      return (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {activeCells} de {totalCells} permisos activos
                        </p>
                      );
                    })()}
                  </div>

                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-x-auto">
                    <div className="min-w-[680px]">
                      <div className="grid grid-cols-[180px_1fr_1fr_1fr_1fr_1fr] border-b border-slate-100 bg-slate-50/50">
                        <div className="py-3.5 pl-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</div>
                        {[
                          { name: 'Administrador', color: 'bg-violet-50 text-violet-600' },
                          { name: 'Contabilidad', color: 'bg-blue-50 text-blue-600' },
                          { name: 'Ventas', color: 'bg-emerald-50 text-emerald-600' },
                          { name: 'Bodega', color: 'bg-orange-50 text-orange-600' },
                          { name: 'Mercadeo', color: 'bg-pink-50 text-pink-600' },
                        ].map(({ name, color }) => (
                          <div key={name} className="py-3.5 flex items-center justify-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${color}`}>{name}</span>
                          </div>
                        ))}
                      </div>

                      {activeModules.length > 0 ? activeModules.map((mod, i) => {
                        const Icon = moduleIcons[mod.module_key] || Package;
                        const gradient = moduleColors[mod.module_key] || 'from-slate-500 to-slate-600';
                        const roles = ['admin', 'accounting', 'seller', 'warehouse', 'marketing'];
                        return (
                          <div key={mod.id} className={`grid grid-cols-[180px_1fr_1fr_1fr_1fr_1fr] ${i > 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50/80 transition-colors`}>
                            <div className="py-3.5 pl-6 flex items-center gap-3">
                              <div className={`w-7 h-7 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                                <Icon className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                              </div>
                              <span className="font-bold text-slate-700 text-xs">{mod.module_name}</span>
                            </div>
                            {roles.map(role => {
                              const perm = rolePermissions.find(p => p.role === role && p.module_key === mod.module_key);
                              const isActive = perm?.can_access || false;
                              return (
                                <div key={`${mod.module_key}-${role}`} className="py-3.5 flex items-center justify-center">
                                  <button
                                    onClick={() => togglePermission(role, mod.module_key, isActive)}
                                    className={`relative w-9 h-5 rounded-full transition-all duration-200 ${isActive ? 'bg-emerald-500' : 'bg-slate-200 hover:bg-slate-300'}`}
                                  >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }) : (
                        <div className="p-12 text-center text-slate-400 font-bold text-sm">
                          Activa módulos desde la sección de Módulos para configurar permisos.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </motion.div>
      </AnimatePresence>

      {/* ============================= */}
      {/* USER EDIT MODAL */}
      {/* ============================= */}
      {userEditModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleUpdateUser}
            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-slate-800 font-black text-lg mb-6">
              <UserCog className="w-6 h-6 text-amber-500" /> Editar Usuario
            </div>
            <p className="text-sm font-medium text-slate-500 mb-6">
              Editar información de <span className="font-bold text-slate-800">{userEditModal.userName}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol del Usuario</label>
                <div className="relative">
                  <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="admin">Administrador</option>
                    <option value="accounting">Contabilidad</option>
                    <option value="seller">Ventas</option>
                    <option value="warehouse">Bodega</option>
                    <option value="marketing">Mercadeo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuevo Correo (Opcional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" placeholder="Dejar en blanco para no cambiar"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña (Opcional)</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" placeholder="Dejar en blanco para no cambiar"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setUserEditModal({ isOpen: false, userId: '', userName: '', userEmail: '', role: '' })} 
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={updatingUser} 
                className="px-5 py-2.5 bg-amber-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {updatingUser ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* User Credentials Modal */}
      {showUserCredentials && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black text-slate-800">Usuario creado</h3>
              <p className="text-slate-500 text-sm mt-1">Credenciales del nuevo usuario</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(newUser.email); toast.success('Email copiado'); }}
                  className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 break-all">{newUser.email}</p>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contraseña</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(newUser.password); toast.success('Contraseña copiada'); }}
                  className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm font-bold text-slate-800 font-mono tracking-wider">{newUser.password}</p>
            </div>

            <button
              onClick={() => setShowUserCredentials(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* User Delete Confirm Modal */}
      {userDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setUserDeleteConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center">Eliminar usuario</h3>
            <p className="text-slate-500 text-sm mt-2 text-center leading-relaxed">
              ¿Estás seguro de eliminar a <strong className="text-slate-700">{userDeleteConfirm.name}</strong>?
              Esta acción no se puede deshacer y eliminará su acceso al sistema.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setUserDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
