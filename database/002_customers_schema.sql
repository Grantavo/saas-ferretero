-- TABLA DE CLIENTES
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  id_number text, -- NIT / CC
  email text,
  phone text,
  address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table customers enable row level security;

-- Política de aislamiento
create policy "Users can only see customers from their tenant" on customers
  for all using (tenant_id = (select tenant_id from profiles where id = auth.uid()) or exists (select 1 from tenants where id = customers.tenant_id));

-- Trigger para updated_at
create trigger update_customers_updated_at before update on customers for each row execute procedure update_updated_at_column();
