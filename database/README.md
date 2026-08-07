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
| 009 | `009_helper_functions.sql` | **[SEGURIDAD]** Helpers `SECURITY DEFINER` (`is_super_admin`, `current_tenant_id`, `current_role`, `can_access_module`) que rompen la recursión infinita de RLS. **APLICAR PRIMERO** que 007 y 008 |
| 007 | `007_fix_customers_rls.sql` | **[SEGURIDAD]** Aislamiento multi-tenant estricto en `customers` (USING+WITH CHECK, sin cláusula comodín) + reescritura de las demás policies `for all` sin WITH CHECK de 001/003 |
| 008 | `008_fix_profiles_privesc.sql` | **[SEGURIDAD]** Cierra auto-escalación en `profiles`: solo super admin escribe; usuario normal no puede tocar `role`/`is_super_admin`/`tenant_id` |
| 010 | `010_audit_log.sql` | **[SEGURIDAD]** Tabla `audit_log` de acciones administrativas (RLS: solo lectura para super admin) |

## ⚠️ Orden de seguridad (puntos críticos de RLS)

Los cambios de RLS son interdependentes: **009 debe aplicarse ANTES que 007 y 008**, porque 007 y 008 usan los helpers que crea 009. Probarlos en staging antes de producción.

```
009 (helpers)  →  007 (customers + audit for all)  →  008 (profiles privesc)
```

## Archivos sin orden definido (nunca aplicados en producción)

Los siguientes archivos existen en el repo pero **no tienen historial de ejecución** ni se sabe si deben correrse:

- `fix_trigger_profiles.sql` — Corrige/actualiza el trigger `on_auth_user_created`
- `remove_trigger_profiles.sql` — Elimina el trigger `on_auth_user_created` y su función

## ⚠️ Advertencia importante

Antes de correr un `ALTER TABLE ... ADD CONSTRAINT`, verificar con `\d+ nombre_tabla` en el SQL Editor si ya existe una constraint con ese propósito, para evitar el bug de **constraints duplicadas** ya ocurrido en `profiles.role`.

<!-- preview deployment test -->