-- ============================================================
-- 013: CARTERA DE CLIENTES — CRÉDITO POR FACTURA + ABONOS
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- Requiere: 001 (record_sale), 011, 012 aplicados.
-- ============================================================

-- 1) LÍMITE DE CRÉDITO POR CLIENTE
--    credit_limit <= 0 => el cliente no puede comprar a crédito.
alter table customers add column if not exists credit_limit numeric default 0;

-- 2) ESTADO DE CRÉDITO EN VENTAS
--    status: paid | pending | partial  (pediente por defecto hasta migrar)
alter table sales add column if not exists status text default 'paid';
alter table sales add column if not exists amount_paid numeric default 0;
alter table sales add column if not exists balance numeric default 0;

-- 3) TABLA DE ABONOS / COBROS (cartera)
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid references sales(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamp with time zone default now()
);

alter table payments enable row level security;

create policy "Payments tenant isolation" on payments
  for all using (
    tenant_id = (select tenant_id from profiles where id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- 4) WRAPPER DE VENTA CON CLIENTE + CRÉDITO.
--    record_sale se llama SIEMPRE con 'cash' (valor probado en prod; su
--    definición no está en el repo). El término real se registra en sales.
--    Si el cliente no tiene límite o lo supera, se lanza excepción:
--    dentro de la misma transacción eso revierte toda la venta (stock incluido).
create or replace function public.record_sale_with_customer(
  p_items jsonb,
  p_payment_method text,
  p_customer_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_total numeric;
  v_pending numeric;
  v_limit numeric;
begin
  select public.record_sale(p_items, 'cash') into v_sale_id;

  if p_customer_id is not null then
    update public.sales
      set customer_id = p_customer_id
      where id = v_sale_id;

    if p_payment_method = 'credit' then
      select total_amount into v_total from public.sales where id = v_sale_id;
      select credit_limit into v_limit from public.customers where id = p_customer_id;
      select coalesce(sum(balance), 0) into v_pending
        from public.sales
        where customer_id = p_customer_id and status in ('pending', 'partial');

      if v_limit is null or v_limit <= 0 then
        raise exception 'El cliente no tiene limite de credito configurado';
      end if;
      if coalesce(v_total, 0) + coalesce(v_pending, 0) > v_limit then
        raise exception 'Supera el limite de credito del cliente';
      end if;

      update public.sales
        set payment_method = 'credit',
            status = 'pending',
            amount_paid = 0,
            balance = total_amount
        where id = v_sale_id;
    else
      update public.sales
        set payment_method = 'cash',
            status = 'paid',
            amount_paid = total_amount,
            balance = 0
        where id = v_sale_id;
    end if;
  end if;

  return v_sale_id;
end;
$$;

grant execute on function public.record_sale_with_customer(jsonb, text, uuid) to authenticated;

-- 5) REGISTRAR UN ABONO / PAGO TOTAL SOBRE UNA VENTA A CRÉDITO
create or replace function public.record_sale_payment(p_sale_id uuid, p_amount numeric, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_balance numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto del abono debe ser mayor a cero';
  end if;

  select tenant_id, balance into v_tenant, v_balance
    from public.sales where id = p_sale_id;

  if v_tenant is null then
    raise exception 'Venta no encontrada';
  end if;

  if v_balance is null or v_balance <= 0 then
    raise exception 'Esta factura no tiene saldo pendiente';
  end if;

  if p_amount > v_balance then
    raise exception 'El abono supera el saldo pendiente de la factura';
  end if;

  insert into public.payments (sale_id, tenant_id, amount, note)
    values (p_sale_id, v_tenant, p_amount, p_note);

  update public.sales
    set amount_paid = amount_paid + p_amount,
        balance = balance - p_amount,
        status = case when balance - p_amount <= 0 then 'paid' else 'partial' end
    where id = p_sale_id;
end;
$$;

grant execute on function public.record_sale_payment(uuid, numeric, text) to authenticated;

-- 5) VISTA DE CARTERA POR CLIENTE (para el dashboard de Pagos/Cartera)
create or replace view public.customer_receivables
with (security_invoker = true) as
select
  c.id as customer_id,
  c.full_name,
  c.credit_limit,
  (
    select coalesce(sum(ps.balance), 0)
    from public.sales ps
    where ps.customer_id = c.id and ps.status in ('pending', 'partial')
  ) as total_due,
  (
    select count(*)
    from public.sales ps
    where ps.customer_id = c.id and ps.status in ('pending', 'partial')
  ) as open_invoices
from public.customers c;