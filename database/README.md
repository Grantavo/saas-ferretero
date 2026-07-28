# Migraciones SQL — Base de Datos Supabase

Estos scripts se ejecutan **manualmente** en el SQL Editor de Supabase. No hay herramienta de migraciones automatizada todavía.

## Orden de ejecución

| Orden | Archivo | Qué hace |
|-------|---------|----------|
| 001 | `001_database_v2.sql` | Esquema base: tablas `tenants`, `profiles`, `products`, auth multi-tenancy, super admin |
| 002 | `002_customers_schema.sql` | Tabla `customers` con FK a `tenants(id)` |
| 003 | `003_role_permissions.sql` | Tabla `role_permissions` (rol → módulo), función seed y RLS |
| 004 | `004_migracion_roles.sql` | Migración one-off: renombra valores viejos en `profiles.role` (`owner`→`admin`, `seller`→`accounting`) |
| 005 | `005_fix_profiles_role_constraint.sql` | Elimina CHECK constraint duplicada en `profiles.role`, deja solo `valid_roles` |
| 006 | `006_add_email_to_profiles.sql` | Agrega columna `email` a `profiles` con backfill desde `auth.users` |

## Archivos sin orden definido (nunca aplicados en producción)

Los siguientes archivos existen en el repo pero **no tienen historial de ejecución** ni se sabe si deben correrse:

- `fix_trigger_profiles.sql` — Corrige/actualiza el trigger `on_auth_user_created`
- `remove_trigger_profiles.sql` — Elimina el trigger `on_auth_user_created` y su función

## ⚠️ Advertencia importante

Antes de correr un `ALTER TABLE ... ADD CONSTRAINT`, verificar con `\d+ nombre_tabla` en el SQL Editor si ya existe una constraint con ese propósito, para evitar el bug de **constraints duplicadas** ya ocurrido en `profiles.role`.

<!-- preview deployment test -->