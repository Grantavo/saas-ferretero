import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/supabase/requireSuperAdmin';
import { validatePassword } from '@/lib/validation/password';
import { rateLimit, clientIp } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const { email, password, full_name, tenant_id, role } = await request.json();

    if (!email || !password || !tenant_id) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Política de contraseña (punto 9).
    const pwError = validatePassword(password);
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[create-user] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    // Rate limiting por IP.
    const ip = clientIp(request);
    const limit = rateLimit(`admin-create-user:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intente en ${limit.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    // 1. Verificar que el que hace la petición es super admin
    const supabase = await createServerClient();
    const auth = await requireSuperAdmin(supabase);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const actor = auth.user!;

    // 1.1. Auditoría.
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        actor_id: actor.id,
        action: 'user.create',
        target_type: 'auth.users',
        metadata: { email, role, tenant_id },
      });
    if (auditError) console.error('[create-user] audit insert:', auditError.message);

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

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        tenant_id,
        role: role || 'admin',
        is_super_admin: false,
      },
    });

    if (error) {
      console.error('[create-user] admin.createUser error:', error.message);
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
        role: role || 'admin',
        is_super_admin: false,
      });

    if (profileError) {
      console.error('[create-user] Error al crear perfil:', profileError.message);
      await supabaseAdmin.auth.admin.deleteUser(data.user.id).catch(() => {});
      return NextResponse.json({ error: 'Error al crear el perfil del usuario: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data.user });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    console.error('[create-user] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
