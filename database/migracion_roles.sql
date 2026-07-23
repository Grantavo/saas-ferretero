BEGIN;

UPDATE profiles SET role = 'admin' WHERE role = 'owner';

UPDATE profiles SET role = 'accounting' WHERE role = 'seller';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_roles;

ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'accounting', 'seller', 'warehouse', 'marketing'));

ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'admin';

COMMIT;
