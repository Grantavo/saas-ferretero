import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/supabase/requireSuperAdmin';
import { rateLimit, clientIp } from '@/lib/security/rateLimit';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();

    // 0. Rate limiting por IP (ruta destructiva de admin).
    const ip = clientIp(request);
    const limit = rateLimit(`admin-delete-tenant:${ip}`);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intente en ${limit.retryAfterSec}s.` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
      );
    }

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
            // Read-only on server components/routes if not modified correctly
          },
        },
      }
    );

    const auth = await requireSuperAdmin(supabase);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const actor = auth.user!;

    // 3. Obtener el ID del tenant a eliminar
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta el ID del tenant' }, { status: 400 });
    }

    // 3.5 Auditoría antes de la acción destructiva.
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert({
        actor_id: actor.id,
        action: 'tenant.delete',
        target_type: 'tenants',
        target_id: tenantId,
      });
    if (auditError) console.error('[delete-tenant] audit insert:', auditError.message);

    // 4. Inicializar el cliente Admin (con Service Role Key)
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Encontrar todos los usuarios asociados a este tenant
    const { data: profilesToDelete, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenantId);

    if (profilesError) {
      return NextResponse.json({ error: 'Error al buscar usuarios asociados' }, { status: 500 });
    }

    // 6. Eliminar cada usuario del sistema de Auth
    if (profilesToDelete && profilesToDelete.length > 0) {
      for (const p of profilesToDelete) {
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(p.id);
        if (deleteUserError) {
          console.error('Error deleting auth user:', deleteUserError.message);
          // Opcionalmente podrías detenerte aquí, pero es mejor intentar borrar la mayor cantidad posible
        }
      }
    }

    // 7. Finalmente, eliminar el tenant de la tabla pública (las políticas en cascada harán el resto)
    const { error: deleteTenantError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (deleteTenantError) {
      return NextResponse.json({ error: 'Error al eliminar el tenant: ' + deleteTenantError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('Error in delete-tenant route:', message);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
