# Vulnerabilidades ERP JENTA — Auditoría & Remisión

Auditoría de seguridad (white-box) sobre el ERP. Cada hallazgo se cierra con evidencia:
archivo(s) `.sql` y/o código, marcas 🟢 en este documento y su entrada en `CHANGELOG.md`.

**Reglas de remisión**: los scripts `.sql` se generan versionados en `database/` y se
**aplican manualmente vía Supabase SQL Editor** en staging primero (nunca directo a
producción). `007`, `008` y `010` dependen de `009` (helpers SECURITY DEFINER):
orden `009 → 007 → 008 → 010`.

---

## CRÍTICOS

### C1 — Fuga cross-tenant: policy de `customers` con tautología
- **Riesgo**: la policy `for all using (tenant_id = <propio> OR exists(select 1 from tenants where id = customers.tenant_id))` era SIEMPRE VERDADERA (la FK `customers.tenant_id → tenants.id` garantiza la fila). Cualquier usuario autenticado podía leer/insertar/actualizar/borrar clientes de **cualquier ferretería**, anulando el aislamiento multi-tenant.
- **Fix**: `database/007_fix_customers_rls.sql` — reescritas como `for all using(...) with check(...)`, sin cláusulas comodín, usando `public.current_tenant_id()` / `public.is_super_admin()`.
- **Extensión**: se auditaron y reescribieron por el mismo defecto las policies `for all` sin `WITH CHECK` de `tenants`, `products`, `sales`, `sale_items`, `subscriptions` y `role_permissions`.
- **Estado**: 🟢 Mitigado (SQL generado; falta aplicar en staging/prod).
- **Prueba**: un usuario normal no debe ver filas de otro tenant:
  `select * from customers;` → solo las de su `tenant_id`; insert con `tenant_id` ajeno → rechazado por RLS.

### C2. Escalación de privilegios en `profiles` (auto-elevación)
- **Riesgo**: la policy "Profile access policy" era `for all using(...)` **SIN `WITH CHECK`**. Un usuario normal podía `UPDATE profiles SET is_super_admin=true, role='admin' WHERE id = auth.uid()` sobre su propia fila (USING la hacía visible; sin WITH CHECK la escritura nueva caía en RLS default-ALLOW) → **auto-escalación total**.
- **Fix**: `database/008_fix_profiles_privesc.sql` — se adopta la opción recomendada: NO permitir nunca que el usuario actualice su perfil por API pública. Solo el super admin escribe (`profiles_write_super_admin`); el usuario normal solo lee su fila (`profiles_select`). Cualquier cambio futuro de perfil debe pasar por una API server-side.
- **Estado**: `✅` Mitigado (SQL a aplicar).
- **Prueba**: usuario normal: `update profiles set is_super_admin=true where id = auth.uid();` → `new row violates row-level security policy`.

### C3. Recursión infinita / auto-referencia en RLS
- **Riesgo**: las policies leían `profiles`/`tenants` con subconsultas directas desde la propia tabla protegida → PostgreSQL "infinite recursion detected". Volvía RLS inoperable (caía en bloqueos) y obligaba a correr el sistema con RLS mal resuelto.
- **Fix**: `database/009_helper_functions.sql` — helpers `SECURITY DEFINER` con `search_path` fijado: `public.is_super_admin()`, `public.current_tenant_id()`, `public.current_role()`, `public.can_access_module(text)`. Corren con privilegios del definer y NO re-aplican RLS, rompiendo el ciclo. Solo `authenticated` tiene `EXECUTE`.
- **Estado**: ✅ Mitigado (SQL a aplicar; **primero** que 007/008/010).
- **Prueba**: un usuario normal debe poder `select * from profiles where id = auth.uid();` sin error de recursión.

---

## ALTOS

### A1. Páginas bootstrap `/setup` y `/test-db`
- **Riesgo**: exponían la creación de un tenant/lectura de configuración desde el cliente; son herramientas de dev y dejan la superficie de onboarding sin el flujo de admin.
- **Fix**: eliminadas `src/app/setup/page.tsx` y `src/app/test-db/page.tsx`. `src/proxy.ts` ya redirige a login cualquier ruta no pública (solo `'/'`,`'/login'`,`'/auth/*'`,`'/api/ping'`).
- **Estado**: ✅ Mitigado.
- **Verificación**: `npx next build` no lista esas rutas.

### A2. Importación de inventario: confusión de tenant
- **Riesgo**: `src/app/dashboard/inventory/import/page.tsx` hacía `tenants.select('id').limit(1).single()` → el **primer tenant** de la tabla, ajeno al usuario. Además parseaba e insertaba desde el cliente con el anon key (RLS nuevo anularía, o quedaría insertando a tenant equivocado).
- **Fix**: movida a API route luego `src/app/api/dashboard/inventory/import/route.ts`. El tenant se **deriva de la sesión autenticada** (`profile.tenant_id`), nunca del cliente. Inserción con Service Role Key en bloques de 50. Límites 5 MB / 5000 filas. Control de módulo `inventory` (punto 7).
- **Estado**: ✅ Mitigado.
- **Verificación**: subir un `.xlsx` desde la UI con dos tenants distintos y confirmar que cada producto cae en el tenant del usuario autenticado.

### A3. `xlsx@0.18.5` con CVEs (parseo en cliente)
- **Riesgo**: `xlsx` arrastra vulnerabilidades sin fix publicado; se parseaba en el cliente (menor superficie pero dependencia vulnerable ya presente).
- **Fix**: reemplazado por `exceljs@4.4.0` en `package.json`; parsing **server-side** en la API route.
- **Estado**: ✅ Mitigado.
- **Nota**: `npm audit` aún reporta vulns de `next` (incluye bypass de middleware en Turbopack, relevante al `proxy.ts`), `sharp` y `postcss` (deps de `next`). Fix requiere `next@16.3.0` (fuera del rango declarado). **Decisión de upgrade pendiente y documentada en CHANGELOG.**

## MEDIOS

### M1. Enforcement de `role_permissions` a nivel de datos + rutas
- **Riesgo**: los permisos por módulo solo se aplicaban en UI; nada lo reforzaba en rutas/API que saltan RLS.
- **Fix**: (a) policies de `role_permissions` reescritas con helpers en `007`; (b) helper `src/lib/supabase/requireModule.ts` que valida `role + module_key + can_access` por Service Role Key, **aplicado** en la ruta de import de inventario (y disponible para el resto de rutas de módulo).
- **Estado**: ✅ Mitigado (rutas de módulo restantes a conectar de forma gradual).

### M2. Headers de seguridad HTTP
- **Riesgo**: respuestas sin `X-Frame-Options`, `nosniff`, etc. → clickjacking/MIME sniffing.
- **Fix**: `next.config.ts` con `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. CSP incluida desactivada (documentada) por riesgo de romper estilos inline de Next.
- **Estado**: ✅ Mitigado.

### M3. Política de contraseña + rate limiting
- **Riesgo**: no había mínimo de seguridad; rutas admin sin limitación de fuerza bruta.
- **Fix**: `src/lib/validation/password.ts` (`≥10` caracteres), `src/lib/security/rateLimit.ts` (10 req/min por IP, en memoria). Aplicados en `api/admin/users/create` y `api/admin/users/password`. Nota: para multi-instancia/edge convendrá un store compartido.
- **Estado**: ✅ Mitigado.

### M4. Auditoría de acciones administrativas
- **Riesgo**: acciones sensibles (cambio de rol, contraseñas, creación/eliminación de usuarios, borrado de tenants) sin trazabilidad.
- **Fix**: `database/010_audit_log.sql` — tabla `audit_log` con RLS (solo super admin lee; insert del propio actor). Se inserta desde todas las rutas de admin: `users/create`, `create-user`, `users/password`, `users/delete` y `delete-tenant`.
- **Estado**: ✅ Código OK (falta aplicar `010` en SQL Editor).

---

## Resumen de estado

| ID | Severidad | Fix | Estado |
|---|--------|-----|--------|
| C1 | CRITICO | `007` | ⏳ SQL a aplicar |
| C2 | CRITICO | `008` | ⏳ SQL a aplicar |
| C3 | CRITICO | `009` | ⏳ SQL a aplicar |
| A1 | ALTO | borrado + `proxy.ts` | ✅ |
| A2 | ALTO | API route server-side | ✅ |
| A3 | ALTO | `exceljs` server-side | ✅ + nota |
| M1 | MEDIO | `007` + `requireModule` (aplicado en import) | ✅ |
| M2 | MEDIO | `next.config.ts` | ✅ |
| M3 | MEDIO | password + rateLimit (todas las rutas admin) | ✅ |
| M4 | MEDIO | `010` + auditoría en 5 rutas admin | ⚠️ Código OK, SQL a aplicar |

**Pendiente de aplicar (entorno Supabase SQL Editor, en orden 009 → 007 → 010)**:
- `database/009_helper_functions.sql`
- `database/007_fix_customers_rls.sql`
- `database/008_fix_profiles_privesc.sql`
- `database/010_audit_log.sql`