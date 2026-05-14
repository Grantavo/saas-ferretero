import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
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
            // Read-only on server components/routes if not modified correctly
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

    // 3. Obtener el ID del tenant a eliminar
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Falta el ID del tenant' }, { status: 400 });
    }

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
          console.error(`Error deleting auth user ${p.id}:`, deleteUserError);
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

  } catch (error: any) {
    console.error('Error in delete-tenant route:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
