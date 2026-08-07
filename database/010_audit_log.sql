-- ============================================================
-- 010 — TABLA DE AUDITORÍA DE ACCIONES ADMINISTRATIVAS
-- Cierra: [MEDIO] falta de trazabilidad de acciones de admin
-- Aplicar DESPUÉS de 009 (usa public.is_super_admin()).
-- ============================================================
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

alter table audit_log enable row level security;

-- Lectura: SOLO super admin (traza completa). El resto no ve nada.
create policy "audit_log_read_super_admin" on audit_log
  for select using (public.is_super_admin());

-- Escritura: el propio actor autenticado inserta su registro de
-- auditoría (ej. desde las rutas /api/admin/* con cliente server),
-- además del super admin con Service Role Key.
create policy "audit_log_insert_actor" on audit_log
  for insert
  with check (actor_id = auth.uid() or public.is_super_admin());

-- Índice para consultar por actor y por acción.
create index if not exists audit_log_actor_idx on audit_log(actor_id, created_at);
create index if not exists audit_log_action_idx on audit_log(action);

-- ============================================================
-- USO DESDE LA APP
-- Las rutas admin insertan con el cliente server del actor logueado:
--   await supabase.from('audit_log').insert({
--     actor_id: authUser.id,
--     action: 'user.create' | 'user.password_update' | 'user.delete' | ...,
--     target_type: 'auth.users' | 'profiles' | 'tenants',
--     metadata: { ... },
--   });
-- ============================================================
-- PRUEBA MANUAL (staging):
-- 1) Usuario NORMAL insertando con actor propio: OK (could policy
--    actor_id = auth.uid(), y no puede leer nada ajeno).
-- 2) Usuario NORMAL SELECT audit_log => 0 filas (RLS).
-- 3) Super admin SELECT => ve todos los registros.
-- ============================================================