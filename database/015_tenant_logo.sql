-- ============================================================
-- 015: LOGO DEL NEGOCIO
-- Ejecutar en Supabase SQL Editor (nueva pestaña)
-- ============================================================

-- 1) Columna para la URL del logo
alter table tenants add column if not exists logo_url text;

-- 2) Bucket público de logos
insert into storage.buckets (id, name, public)
values ('tenant-logos', 'tenant-logos', true)
on conflict (id) do nothing;

-- 3) Políticas de acceso al bucket
create policy "Public read tenant logos" on storage.objects
  for select using (bucket_id = 'tenant-logos');

create policy "Authenticated upload tenant logos" on storage.objects
  for insert to authenticated with check (bucket_id = 'tenant-logos');

create policy "Authenticated update tenant logos" on storage.objects
  for update to authenticated using (bucket_id = 'tenant-logos');
