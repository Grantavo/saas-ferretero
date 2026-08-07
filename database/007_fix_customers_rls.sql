-- ============================================================
-- 007 — FIX AISLAMIENTO MULTI-TENANT EN customers (y audit de
-- `for all` en 001)
-- Cierra: [CRÍTICO] fuga cross-tenant en `customers`
-- Aplicar DESPUÉS de 009 (usa public.current_tenant_id() e
-- is_super_admin()).
-- ============================================================
-- La política anterior era:
--   for all using (
--     tenant_id = (select tenant_id from profiles where id = auth.uid())
--     or exists (select 1 from tenants where id = customers.tenant_id)
--   )
-- La cláusula `or exists ... tenants where id = customers.tenant_id`
-- es una TAUTOLOGÍA: por la FK `customer.tenant_id references
-- tenants(id)`, SIEMPRE existe esa fila en tenants, así que la
-- condición es SIEMPRE VERDADERA → cualquier usuario autenticado
-- puede SELECT/INSERT/UPDATE/DELETE cualquier cliente de cualquier
-- tenant. Anula por completo el aislamiento multi-tenant.
-- ============================================================

drop policy if exists "Users can only see customers from their tenant" on customers;

-- Aislamiento estricto: USING (lectura/borrado/scroll) y WITH CHECK
-- (escritura/insert) exigen lo mismo: o el tenant del usuario
-- coincide, o el usuario es super admin. Sin cláusulas comodín.
create policy "Customers tenant isolation (select/update/delete)" on customers
  for all
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  )
  with check (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- NOTA: `for all` con ambos USING+WITH CHECK cubre INSERT, y para
-- INSERT no aplica INSERT: `for all` ya incluye insert con check.

-- ============================================================
-- AUDIT de `for all` en 001_database_v2.sql
-- Se reaplican aquí reescritos con los helpers y SIN condiciones
-- trivialmente verdaderas. Cada uno se lista con el análisis:
-- ============================================================

------------------------
-- 1) tenants -----------
-- Antes: "Tenant access policy"
--   using ( id = (select tenant_id ...) or is_super_admin )
-- PROBLEMA: `for all` SIN WITH CHECK permitía que cualquier
-- usuario INSERT/UPDATE un tenant ajeno (el USING solo filtraba
-- qué filas eran visibles; la escritura sin WITH CHECK caía en
-- default-ALL=true para nuevas filas).
drop policy if exists "Tenant access policy" on tenants;
drop policy if exists "Users can only see their own tenant" on tenants;

create policy "tenants_access" on tenants
  for all
  using (
    id = public.current_tenant_id()
    or public.is_super_admin()
  )
  with check (
    id = public.current_tenant_id()
    or public.is_super_admin()
  );

-- La inserción de un tenant NUEVO (para onboarding) la hace el
-- super admin vía API server-side (service role key), que salta RLS;
-- la policy anterior cubre al super admin.

------------------------
-- 2) products ----------
-- Antes: "Product access policy"
--   using (tenant_id = (select tenant_id...) or is_super_admin)
-- Misma falla: `--no WITH CHECK` → cualquier usuario podía INSERTAR
-- productos con un tenant_id ajeno (no se validaba la columna de
-- escritura).
drop policy if exists "Product access policy" on products;
drop policy if exists "Users can only see products from their tenant" on products;

create policy "products_tenant_isolation" on products
  for all
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  )
  with check (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

------------------------
-- 3) sales --------------
-- Antes: "Sale access policy"
--   using (tenant_id = current_tenant_id() or is_super_admin)
-- Mismo defecto: `--no WITH CHECK`. Fuerza tenant de escritura.
drop policy if exists "Sale access policy" on sales;
drop policy if exists "Users can only see sales from their tenant" on sales;

create policy "sales_tenant_isolation" on sales
  for all
  using (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  )
  with check (
    tenant_id = public.current_tenant_id()
    or public.is_super_admin()
  );

------------------------
-- 4) sale_items -----------------------------
-- Antes: "Sale items access policy"
--   using (sale_id in (select id from sales))
-- esa condición era demasiado amplia (leía TODAS las sales sin
-- chequar el tenant del usuario). La reescribimos para exigir que
-- la venta padre pertenezca al tenant actual.
drop policy if exists "Sale items access policy" on sale_items;

create policy "sale_items_tenant_isolation" on sale_items
  for all
  using (
    exists (
      select 1 from sales s
      where s.id = sale_items.sale_id
        and (
          s.tenant_id = public.current_tenant_id()
          or public.is_super_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from sales s
      where s.id = sale_items.sale_id
        and (
          s.tenant_id = public.current_tenant_id()
          or public.is_super_admin()
        )
    )
  );

------------------------
-- 5) subscriptions ----------------------------
-- Antes: "Super admins manage all subscriptions" y
--        "users can view their own subscription"
-- Reescribimos para reforzar USING/WITH CHECK y helpers.
drop policy if exists "Super admins manage all subscriptions" on subscriptions;
drop policy if exists "Users can view their own subscription" on subscriptions;

create policy "subscriptions_super_admins" on subscriptions
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "subscriptions_tenant_view" on subscriptions
  for select using (
    tenant_id = public.current_tenant_id()
  );

------------------------
-- 6) role_permissions (003) -------------------------
-- Se reescribe también para usar los helpers y evitar recursión:
drop policy if exists "Super admins manage all role permissions" on role_permissions;
drop policy if exists "Users can view their role permissions" on role_permissions;

create policy "role_permissions_super_admins" on role_permissions
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "role_permissions_tenant_view" on role_permissions
  for select using (
    tenant_id = public.current_tenant_id()
  );

-- ============================================================
-- AUDIT COMPLETO: NO hay más policies `for all` sin WITH CHECK en
-- 001/002/003. Cada reescritura separa USING (lectura) de WITH
-- CHECK (escritura) y no contiene condiciones trivialmente ciertas.
-- ============================================================