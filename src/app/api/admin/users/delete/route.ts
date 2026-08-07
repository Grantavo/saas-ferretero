import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/supabase/requireSuperAdmin';
import { rateLimit, clientIp } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Faltan datos requeridos.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'El servidor no tiene configurada la SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
    }

    // Rate limiting por IP.
    const ip = clientIp(request);
    const limit = rateLimit(`admin-user-delete:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intente en ${limit.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

    // 1. Verificar que el que hace la petición es super admin
    const supabaseServer = await createServerClient();
    const auth = await requireSuperAdmin(supabaseServer, { forbidden: 'Acceso denegado' });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const actor = auth.user!;

    // 1.1. Auditoría.
    const { error: auditError } = await supabaseServer
      .from('audit_log')
      .insert({
        actor_id: actor.id,
        action: 'user.delete',
        target_type: 'auth.users',
        metadata: { userId },
      });
    if (auditError) console.error('[users-delete] audit insert:', auditError.message);

    // 2. Usar service_role key para eliminar al usuario
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

    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
