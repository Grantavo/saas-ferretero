'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'seller' });
  const [savingUser, setSavingUser] = useState(false);

  // States for Changing Password/Email/Role
  const [userEditModal, setUserEditModal] = useState({ isOpen: false, userId: '', userName: '', userEmail: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [tenantRes, modulesRes, usersRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
      supabase.from('tenant_modules').select('*').eq('tenant_id', tenantId).order('module_name'),
      supabase.from('profiles').select('*').eq('tenant_id', tenantId),
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

      alert(`Usuario creado:\nEmail: ${newUser.email}\nContraseña: ${newUser.password}`);
      setShowAddUser(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'seller' });
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
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
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
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
      
      alert('Usuario actualizado exitosamente');
      setUserEditModal({ isOpen: false, userId: '', userName: '', userEmail: '', role: '' });
      setNewPassword('');
      setNewEmail('');
      setNewRole('');
      fetchData(); 
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${userName}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
      
      alert('Usuario eliminado exitosamente');
      fetchData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-violet-50 rounded-[30%] flex items-center justify-center text-violet-600 font-black text-3xl border border-violet-100">
            {tenant?.name?.charAt(0) || 'F'}
          </div>
          {editingTenant ? (
            <div className="space-y-3">
              <input 
                type="text" 
                className="text-2xl font-black text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm" 
                value={tenantForm.name} 
                onChange={e => setTenantForm({...tenantForm, name: e.target.value})} 
              />
              <div className="flex gap-2">
                <input type="text" placeholder="NIT" className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none w-32 focus:ring-2 focus:ring-violet-500/20 shadow-sm" value={tenantForm.nit} onChange={e => setTenantForm({...tenantForm, nit: e.target.value})} />
                <input type="text" placeholder="Teléfono" className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none w-32 focus:ring-2 focus:ring-violet-500/20 shadow-sm" value={tenantForm.phone} onChange={e => setTenantForm({...tenantForm, phone: e.target.value})} />
              </div>
              <input type="text" placeholder="Dirección" className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none w-full focus:ring-2 focus:ring-violet-500/20 shadow-sm" value={tenantForm.address} onChange={e => setTenantForm({...tenantForm, address: e.target.value})} />
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{tenant?.name}</h1>
              <p className="text-slate-400 mt-1 text-sm font-bold uppercase tracking-widest">
                NIT: {tenant?.nit || 'No registrado'} • {tenant?.address || 'Sin dirección'}
              </p>
              <p className="text-slate-400 mt-0.5 text-xs font-bold uppercase tracking-widest">
                Tel: {tenant?.phone || 'No registrado'}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {editingTenant ? (
            <>
              <button 
                onClick={() => setEditingTenant(false)} 
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTenant} 
                disabled={savingTenant} 
                className="px-4 py-2 bg-violet-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-violet-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {savingTenant ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditingTenant(true)} 
              className="px-4 py-2 bg-white text-slate-600 text-xs font-black uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
            >
              Editar Info
            </button>
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* MÓDULOS - Estilo Odoo Apps Manager */}
      {/* ============================================= */}
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

      {/* ============================================= */}
      {/* USUARIOS DE ESTA FERRETERÍA */}
      {/* ============================================= */}
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

        {/* Add User Form */}
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
                  <option value="seller">Vendedor</option>
                  <option value="owner">Dueño</option>
                  <option value="admin">Administrador</option>
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

        {/* Users List */}
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
                    {user.role === 'owner' ? 'Dueño' : user.role === 'admin' ? 'Administrador' : user.role === 'seller' ? 'Vendedor' : user.role === 'warehouse' ? 'Bodega' : 'Mercadeo'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  user.role === 'owner' ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {user.role === 'owner' ? 'DUEÑO' : user.role === 'admin' ? 'ADMIN' : user.role === 'seller' ? 'VENDEDOR' : user.role === 'warehouse' ? 'BODEGA' : 'MERCADEO'}
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
                    onClick={() => handleDeleteUser(user.id, user.full_name)}
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

      {/* User Edit Modal */}
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
                    <option value="owner">Dueño</option>
                    <option value="admin">Administrador</option>
                    <option value="seller">Vendedor</option>
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
    </div>
  );
}
