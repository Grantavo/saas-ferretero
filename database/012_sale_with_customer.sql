-- ============================================================
-- 012: VENTAS CON CLIENTE ATÓMICO + TOTALES POR CLIENTE
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- Requiere: 001 (record_sale), 011 (columns de cliente) aplicados.
-- ============================================================

-- 1) Wrapper de venta con cliente: la transacción es atómica,
--    el cliente queda vinculado en la MISMA transacción que la venta
--    (NO hay update post-hoc desde el front). No modifica record_sale.
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
begin
  select public.record_sale(p_items, p_payment_method) into v_sale_id;
  if v_sale_id is not null and p_customer_id is not null then
    update public.sales set customer_id = p_customer_id where id = v_sale_id;
  end if;
  return v_sale_id;
end;
$$;

-- 2) Vista de totales facturados POR CLIENTE:
--    Una fila por cliente con número de ventas y suma facturada.
--    security_invoker: ejecuta con los permisos/RLS del usuario que consulta
--    (cada usuario ve solo los clientes de su tenant).
create or replace view public.customer_sales_totals
with (security_invoker = true) as
select
  customer_id,
  count(*) as sales_count,
  coalesce(sum(total_amount), 0) as total_amount
from public.sales
where customer_id is not null
group by customer_id;