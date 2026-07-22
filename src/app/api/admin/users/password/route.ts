import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const { userId, newPassword, newEmail } = await request.json();

    if (!userId || (!newPassword && !newEmail)) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'El servidor no tiene configurada la SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
    }

    // 1. Verificar que el que hace la petición es super admin
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', currentUser.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // 2. Usar service_role key para cambiar la contraseña
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const updatePayload: Record<string, string> = {};
    if (newPassword) updatePayload.password = newPassword;
    if (newEmail) updatePayload.email = newEmail;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updatePayload
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
