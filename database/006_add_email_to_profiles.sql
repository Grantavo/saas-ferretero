-- ============================================================
-- Agregar email a profiles + actualizar trigger
-- Ejecutar en Supabase SQL Editor
-- ============================================================

alter table profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, tenant_id, role, is_super_admin, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'seller'),
    coalesce((new.raw_user_meta_data->>'is_super_admin')::boolean, false),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Copiar emails de auth.users a profiles para usuarios existentes
update profiles
set email = au.email
from auth.users au
where profiles.id = au.id
  and profiles.email is null;
