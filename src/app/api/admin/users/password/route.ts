import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/supabase/requireSuperAdmin';

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

    const auth = await requireSuperAdmin(supabase, { forbidden: 'Acceso denegado' });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
