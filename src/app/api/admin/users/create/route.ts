import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, full_name, tenant_id, role } = await request.json();

    if (!email || !password || !full_name || !tenant_id || !role) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'El servidor no tiene configurada la SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
    }

    // 1. Verificar que el que hace la petición es super admin
    const supabaseServer = await createServerClient();
    const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('is_super_admin')
      .eq('id', currentUser.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 2. Usar service_role key para crear el usuario
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('[users-create] Creating user for tenant:', tenant_id, 'email:', email);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        tenant_id,
        role,
        is_super_admin: false,
      },
    });

    if (error) {
      console.error('[users-create] Supabase admin.createUser error:', error.message, error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Crear el perfil manualmente (el trigger fue eliminado)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: full_name || '',
        email: email,
        tenant_id,
        role: role || 'seller',
        is_super_admin: false,
      });

    if (profileError) {
      console.error('[users-create] Error al crear perfil:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {});
      return NextResponse.json({ error: 'Error al crear el perfil del usuario: ' + profileError.message }, { status: 500 });
    }

    console.log('[users-create] Usuario y perfil creados exitosamente:', data.user.id);
    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error('[users-create] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
