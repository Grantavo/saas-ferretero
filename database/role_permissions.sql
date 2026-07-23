create table if not exists role_permissions (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  role text not null check (role in ('admin', 'accounting', 'seller', 'warehouse', 'marketing')),
  module_key text not null,
  can_access boolean default false,
  created_at timestamp with time zone default now(),
  unique(tenant_id, role, module_key)
);

alter table role_permissions enable row level security;

create policy "Super admins manage all role permissions" on role_permissions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

create policy "Users can view their role permissions" on role_permissions
  for select using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

create or replace function public.create_default_role_permissions(p_tenant_id uuid)
returns void as $$
begin
  insert into role_permissions (tenant_id, role, module_key, can_access) values
    -- admin: acceso a todo
    (p_tenant_id, 'admin', 'inventory', true),
    (p_tenant_id, 'admin', 'pos', true),
    (p_tenant_id, 'admin', 'sales', true),
    (p_tenant_id, 'admin', 'customers', true),
    (p_tenant_id, 'admin', 'payments', true),
    (p_tenant_id, 'admin', 'history', true),
    (p_tenant_id, 'admin', 'chat', true),
    (p_tenant_id, 'admin', 'calendar', true),
    (p_tenant_id, 'admin', 'tasks', true),
    (p_tenant_id, 'admin', 'settings', true),
    -- accounting: ventas, clientes, pagos
    (p_tenant_id, 'accounting', 'sales', true),
    (p_tenant_id, 'accounting', 'customers', true),
    (p_tenant_id, 'accounting', 'payments', true),
    -- seller: inventario, pos, clientes
    (p_tenant_id, 'seller', 'inventory', true),
    (p_tenant_id, 'seller', 'pos', true),
    (p_tenant_id, 'seller', 'customers', true),
    -- warehouse: solo inventario
    (p_tenant_id, 'warehouse', 'inventory', true),
    -- marketing: clientes, conversaciones
    (p_tenant_id, 'marketing', 'customers', true),
    (p_tenant_id, 'marketing', 'chat', true);
end;
$$ language plpgsql security definer;
