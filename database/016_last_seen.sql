-- ============================================================
-- 016: PRESENCIA — ÚLTIMA ACTIVIDAD DE USUARIOS
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- ============================================================

alter table profiles add column if not exists last_seen_at timestamp with time zone;

-- RPC para que cualquier usuario autenticado actualice su último latido
-- SECURITY DEFINER evita RLS (profiles_write_super_admin bloquea update directo)
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.touch_last_seen() to authenticated;
