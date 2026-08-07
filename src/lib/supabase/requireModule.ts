import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Valida que el usuario autenticado tenga acceso a un módulo según su rol.
// Se usa a nivel de API route (punto 7): aunque RLS ya acota las tablas,
// las rutas que usan Service Role Key saltan RLS, por lo que el control
// de módulo se refuerza explícitamente acá (defense in depth).
export async function requireModuleAccess(
  moduleKey: string,
  messages?: { message?: string }
): Promise<{ role: string | null; error: string | null; status: number | null }> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { role: null, error: 'No autorizado', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { role: null, error: 'No autorizado', status: 401 };
  }

  // El super admin tiene acceso total a todos los módulos.
  if (profile.is_super_admin) {
    return { role: 'super_admin', error: null, status: null };
  }

  if (!profile.tenant_id) {
    return { role: profile.role, error: 'No autorizado', status: 401 };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { role: profile.role, error: 'Error de configuración del servidor', status: 500 };
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: access } = await admin
    .from('role_permissions')
    .select('can_access')
    .eq('tenant_id', profile.tenant_id)
    .eq('role', profile.role)
    .eq('module_key', moduleKey)
    .maybeSingle();

  const allowed = access?.can_access === true;
  if (!allowed) {
    return { role: profile.role, error: messages?.message ?? 'Permisos insuficientes', status: 403 };
  }

  return { role: profile.role, error: null, status: null };
}