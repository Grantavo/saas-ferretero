-- ============================================================
-- 008 — CERRAR AUTO-ESCALACIÓN DE PRIVILEGIOS EN profiles
-- Cierra: [CRÍTICO] escalación de privilegios (profiles)
-- Aplicar DESPUÉS de 009 (usa public.is_super_admin() y
-- current_tenant_id(), que rompen la recursión).
-- ============================================================
-- La política anterior:
--   create policy "Profile access policy" on profiles
--     for all using (
--       id = auth.uid()
--       or tenant_id = (select tenant_id from profiles where id = auth.uid())
--       or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
--     );
-- Dos fallas graves:
--   1. FOR ALL SIN WITH CHECK → un usuario podía ejecutar
--      UPDATE profiles SET is_super_admin = true, role = 'admin'
--      WHERE id = auth.uid()  sobre SU propia fila (el USING la
--      vuelve visible, y sin WITH CHECK la escritura cae en
--      default-all=true) → AUTO-ESCALACIÓN TOTAL de privilegios.
--   2. Subconsultas directas a `profiles` dentro de la política de
--      la propia tabla `profiles` → recursión infinita de RLS
--      ("infinite recursion detected in policy for relation").
--
-- Solución adoptada: la RECOMENDADA del punto 2 — NO permitir NUNCA
-- que el usuario actualice su perfil por la API pública; cualquier
-- cambio de profile pasa por super admin (vía RLS) o, a futuro, por
-- una API server-side con Service Role Key.
-- ============================================================

drop policy if exists "Profile access policy" on profiles;

-- Lectura: propia fila, del mismo tenant, o super admin.
-- Usa helpers SECURITY DEFINER para no re-entrar a `profiles`.
create policy "profiles_select" on profiles
  for select using (
    id = auth.uid()
    or tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- SOLO el super admin puede escribir en `profiles`.
-- WITHOUT un policy de update para usuarios normales, PostgreSQL
-- niega por defecto cualquier UPDATE/INSERT/DELETE de un usuario
-- normal vía la API pública, cerrando la auto-escalación.
create policy "profiles_write_super_admin" on profiles
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- (El super admin, además, ya crea/edita perfiles con update del
-- rol vía la ruta /admin/tenants/[id], que usa sesión de super
-- admin: esta policy lo permite.)

-- ============================================================
-- PRUEBA MANUAL (entorno staging, no producción)
-- Después de aplicar 009 + 008:
--
-- 1) Un usuario NORMAL NO puede escalarse (DEBE FALLAR):
--      update profiles set is_super_admin = true where id = auth.uid();
--      => new row violates row-level security policy
--
-- 2) Un usuario NORMAL NO puede cambiar su rol (DEBE FALLAR):
--      update profiles set role = 'admin' where id = auth.uid();
--      => new row violates row-level security policy
--
-- 3) Un usuario NORMAL SÍ lee su propio perfil (sin recursión):
--      select * from profiles where id = auth.uid();
--      => devuelve su fila, sin "infinite recursion detected"
--
-- 4) Un usuario NORMAL NO ve perfiles de otro tenant:
--      select * from profiles;  -- solo ve su fila (o ninguna ajena)
--
-- 5) Un SUPER ADMIN SÍ edita el rol de otro usuario:
--      update profiles set role='seller' where id = <otro>;
--      => OK
-- -----------------------------------------------------------------
-- ⚠️ Si en el futuro se permite que un usuario edite su full_name/
-- avatar por API pública, crear una policy `profiles_update_self`
-- acotada A ESOS CAMPOS y validada server-side; jamás role/
-- is_super_admin/tenant_id.
-- ============================================================