-- ============================================================
-- REPARAR CONSTRAINT DUPLICADA EN profiles.role
-- Elimina la constraint autogenerada y deja solo valid_roles
-- ============================================================

-- 1. Eliminar constraint autogenerada (si existe)
alter table profiles drop constraint if exists profiles_role_check;

-- 2. Eliminar y recrear valid_roles para asegurar valores correctos
alter table profiles drop constraint if exists valid_roles;
alter table profiles add constraint valid_roles check (role in ('admin', 'accounting', 'seller', 'warehouse', 'marketing'));

-- 3. Asegurar default
alter table profiles alter column role set default 'admin';
