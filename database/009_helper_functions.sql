-- ============================================================
-- 009 — HELPER FUNCTIONS SECURITY DEFINER (multi-tenant / RLS)
-- Cierra: [CRÍTICO] recursión infinita y auto-referencia en RLS
-- Aplicar ANTES que 007 y 008 (puntos 1 y 2 dependen de estas).
-- ============================================================
-- Motivo: las políticas RLS de `profiles`/`tenants`/`products`/etc.
-- antes consultaban `profiles` con subconsultas directas
-- (`select ... from profiles where id = auth.uid()`). Como esas
-- políticas protegen a la propia tabla o a otras cuyas políticas
-- leen `profiles`, se produce recursión infinita (PostgreSQL
-- rechaza con "infinite recursion detected in policy for relation").
--
-- Estas funciones son SECURITY DEFINER: al ejecutarlas, el motor
-- corre su consulta interna con los permisos del DEFINER (superna),
-- NO vuelve a aplicar RLS sobre `profiles`, rompiendo el ciclo.
-- El rol `authenticated` solo tiene EXECUTE (no acceso a los
-- datos internos). Se fuerza search_path a `public` y se revoca
-- el acceso por defecto.
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select p.is_super_admin from profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.tenant_id from profiles p where p.id = auth.uid();
$$;

-- Rol del usuario actual (se usa en las políticas de módulo, punto
-- 6: role_permissions a nivel de datos). SECURITY DEFINER por la
-- misma razón de anti-recursión.
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.role from profiles p where p.id = auth.uid();
$$;

-- Devuelve true si el usuario actual (por su rol + tenant) tiene
-- acceso habilitado al módulo dado. Se usa en policies de tablas
-- de módulo (sales, payments, customers, ...) para reforzar
-- role_permissions a nivel de datos, no solo de UI.
create or replace function public.can_access_module(p_module_key text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select rp.can_access
    from role_permissions rp
    where rp.tenant_id = (select p.tenant_id from profiles p where p.id = auth.uid())
      and rp.role = (select p.role from profiles p where p.id = auth.uid())
      and rp.module_key = p_module_key
    limit 1
  ), false);
$$;

-- Revoque acceso general y conceda solo a usuarios autenticados.
revoke all on function public.is_super_admin() from public;
revoke all on function public.current_tenant_id() from public;
revoke all on function public.current_role() from public;
revoke all on function public.can_access_module(text) from public;

grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.current_tenant_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.can_access_module(text) to authenticated;

-- ============================================================
-- PRUEBA MANUAL (entorno staging, no producción)
-- Tras aplicar 009 + 008 + los demás fixes de RLS:
--
-- 1) usuario normal puede leer su PROPIO perfil sin "infinite
--    recursion detected ...":
--      select * from profiles where id = auth.uid();
-- 2) el M su usuario normal NO debe ver perfiles de otro tenant:
--      select count(*) from profiles;  -- solo ve su fila
-- 3) un super admin SI ve todos los perfiles:
--      set role postgres; -- o ejecutar con la service_role key
--      select count(*) from profiles; -- ve todas las filas
-- ============================================================