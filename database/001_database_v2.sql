-- ============================================================
-- ESQUEMA V2: AUTH + MULTI-TENANCY + SUPER ADMIN
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- ============================================================

-- 1. AGREGAR CAMPO DE SUPER ADMIN AL PERFIL
alter table profiles add column if not exists is_super_admin boolean default false;

-- 2. TABLA DE MÓDULOS POR TENANT
-- Controla qué aplicaciones ve cada ferretería
create table if not exists tenant_modules (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  module_key text not null,
  module_name text not null,
  is_active boolean default false,
  created_at timestamp with time zone default now(),
  unique(tenant_id, module_key)
);

alter table tenant_modules enable row level security;

-- Super admins pueden ver y editar todos los módulos
create policy "Super admins manage all modules" on tenant_modules
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Los usuarios normales solo ven los módulos de su tenant
create policy "Users can view their tenant modules" on tenant_modules
  for select using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

-- 3. TABLA DE SUSCRIPCIONES (preparada para el futuro)
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade unique,
  plan text default 'trial' check (plan in ('trial', 'basic', 'pro', 'enterprise')),
  status text default 'active' check (status in ('active', 'inactive', 'suspended')),
  started_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days'),
  created_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

create policy "Super admins manage all subscriptions" on subscriptions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

create policy "Users can view their own subscription" on subscriptions
  for select using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

-- 4. AGREGAR CAMPO DE ESTADO AL TENANT
alter table tenants add column if not exists is_active boolean default true;

-- 5. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRAR USUARIO
-- (El super admin creará usuarios vía la API de admin de Supabase)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, tenant_id, role, is_super_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'seller'),
    coalesce((new.raw_user_meta_data->>'is_super_admin')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Eliminar trigger anterior si existe
drop trigger if exists on_auth_user_created on auth.users;

-- Crear trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. FUNCIÓN PARA CREAR MÓDULOS POR DEFECTO AL CREAR UN TENANT
create or replace function public.create_default_modules(p_tenant_id uuid)
returns void as $$
begin
  insert into tenant_modules (tenant_id, module_key, module_name, is_active) values
    (p_tenant_id, 'inventory', 'Inventario', true),
    (p_tenant_id, 'pos', 'Punto de Venta', true),
    (p_tenant_id, 'sales', 'Ventas', true),
    (p_tenant_id, 'customers', 'Clientes', true),
    (p_tenant_id, 'payments', 'Pagos', false),
    (p_tenant_id, 'history', 'Historial', false),
    (p_tenant_id, 'chat', 'Conversaciones', false),
    (p_tenant_id, 'calendar', 'Calendario', false),
    (p_tenant_id, 'tasks', 'Tareas', false),
    (p_tenant_id, 'settings', 'Ajustes', true);
end;
$$ language plpgsql security definer;

-- 7. ACTUALIZAR POLÍTICAS RLS PARA SUPER ADMIN
-- Super admins pueden ver TODOS los tenants
drop policy if exists "Users can only see their own tenant" on tenants;
create policy "Tenant access policy" on tenants
  for all using (
    id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Super admins pueden ver TODOS los productos
drop policy if exists "Users can only see products from their tenant" on products;
create policy "Product access policy" on products
  for all using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Super admins pueden ver TODAS las ventas
drop policy if exists "Users can only see sales from their tenant" on sales;
create policy "Sale access policy" on sales
  for all using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Política para sale_items
create policy "Sale items access policy" on sale_items
  for all using (
    sale_id in (select id from sales)
  );

-- Política para customers
drop policy if exists "Users can only see customers from their tenant" on customers;
create policy "Customer access policy" on customers
  for all using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Política para profiles (los super admins ven todos)
create policy "Profile access policy" on profiles
  for all using (
    id = auth.uid()
    or tenant_id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );
