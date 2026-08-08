-- ============================================================
-- 011: SNAPSHOT DE CLIENTE Y NOTAS EN FACTURAS
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- Requiere: 001 (sales) aplicado previamente
-- ============================================================

alter table sales add column if not exists customer_id uuid references customers(id);
alter table sales add column if not exists customer_name text;
alter table sales add column if not exists customer_nit text;
alter table sales add column if not exists customer_address text;
alter table sales add column if not exists customer_phone text;
alter table sales add column if not exists notes text;