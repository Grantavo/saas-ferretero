import { type SupabaseClient } from '@supabase/supabase-js';

export async function requireSuperAdmin(
  supabase: SupabaseClient,
  messages?: { forbidden?: string }
) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: 'No autorizado', status: 401 as const };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return { user: null, error: messages?.forbidden ?? 'Permisos insuficientes', status: 403 as const };
  }

  return { user, error: null, status: null };
}