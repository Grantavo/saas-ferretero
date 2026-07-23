import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Verificar sesión actual del usuario que hace la petición
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Read-only on server components/routes if not modified correctly, but we only need to read
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Verificar que el usuario sea Super Admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 3. Inicializar el cliente Admin (con Service Role Key)
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Leer los datos del nuevo usuario
    const body = await request.json();
    const { email, password, full_name, tenant_id, role } = body;

    if (!email || !password || !tenant_id) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 5. Crear el usuario e instantáneamente confirmarlo
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        tenant_id: tenant_id,
        role: role || 'admin',
        is_super_admin: false,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: newUser.user });

  } catch (error: any) {
    console.error('Error in create-user route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
