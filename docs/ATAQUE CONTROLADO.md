# Ataque Controlado — Validación de las Remisiones de Seguridad

Este documento registra el "ataque controlado": cortar las principales amenazas de la
auditoría **antes** de aplicar los fixes, para confirmar que existen (prueba de
vulnerabilidad), y **después**, para confirmar la remisión.

Estado actual: PUNTOS DE CÓDIGO REMITIDOS y verificados con build; los cortes que
dependen de SQL quedan marcados **PENDIENTE** hasta aplicar `009→007→010` en staging.

---
## Escenario 1 — Fuga cross-tenant en `customers` (C1)
**Antes** (vulnerable): policy tautológica `... OR exists(select 1 from tenants where id = customers.tenant_id)`
hacía visible TODO.
**Corte**: con usuario normal autenticado del negocio A...
- **PENDIENTE** `select * from customers;` → ANTES devolvía clientes de B; después de `007`
  devuelve SOLO los del tenant del usuario.
- **PENDIENTE** `insert into customers(tenant_id, ...) values (<tenant B>, ...)` → ANTES OK;
  después → `new row violates row-level security policy`.

## Escenario 2 — Auto-escalación en `profiles` (C2)
**ANTES (exploit real)**: un usuario normal podía
```sql
update profiles set is_super_admin = true, role = 'admin'
where id = auth.uid();
```
(la policy era `for all` sin `WITH CHECK` → escritura propia no bloqueada).
**PENDIENTE**: después de aplicar `008`, el mismo update debe fallar con
`new row violates row-level security policy for relation "profiles"`.

## Escenario 3 — Recursión RLS (C3)
**ANTES**: `select * from profiles where id = auth.uid();` podía disparar
`infinite recursion detected in policy for relation "profiles"`.
**PENDIENTE**: después de `009`, el select del usuario sobre su propia fila funciona y
reclama 401/403 en rutas protegidas para usuario no autenticado.

## Escenario 4 — Páginas bootstrap (A1)
**Antes**: `/setup` y `/test-db` accesibles sin auth.
**Corte**: `npx next build` no las lista; navegar a ellas → redirect a `/login` por `proxy.ts`. ✅ **Verificado.**

## Escenario 5 — Import de inventario a tenant equivocado (A2)
**Antes**: `import/page.tsx` usaba `tenants.select('id').limit(1).single()` → primer tenant.
**Corte**: la UI ya no toca la DB; `POST /api/dashboard/inventory/import` deriva el tenant
de la sesión y exige módulo `inventory`. Un usuario sin módulo → 403. **Verificado** (build +
revisión de código).

## Escenario 6 — Vulnerabilidad de `xlsx` (A3)
**Antes**: dependencia `xlsx@^0.18.5` vulnerable, parseo en cliente.
**Corte**: fuera de `package.json`; `exceljs` server-side. **Verificado con `npm ls`**.
**Nota**: `npm audit` aún marca `next`/`sharp`/`postcss` (decisión de upgrade separada).

## Escenario 7 — Enforcement de módulo (M1)
**Antes**: rol solo limitaba la UI.
**Corte**: `requireModuleAccess('inventory', ...)` en la ruta de import → usuario `seller`
sin permiso del módulo `inventory`... (seller SÍ lo tiene por default; probar con un rol sin
permiso) → 403. **Verificado en código.**

## Escenario 8 — Headers (M2)
**Corte**: `curl -I`/browser devtools → respuesta contiene `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, HSTS. **PENDIENTE** verificación en deploy (dependency de
`next.config.ts`; build ok).

## Escenario 9 — Contraseña débil + fuerza bruta (M3)
**Corte** `POST /api/admin/users/create` con password de 4 chars → 400 `Debe tener ≥ 10`...
11 intentos en 1 min desde misma IP → 429 con `Retry-After`. **En código** (verificar en runtime
serverless una vez desplegado).

## Escenario 10 — Auditoría (M4)
**Corte**: crear un usuario desde admin → fila en `audit_log` con `action='user.create'`.
**PENDIENTE** (requiere aplicar `010_audit_log.sql`).