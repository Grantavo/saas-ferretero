# Notas de Desarrollo — Tips y Lecciones Aprendidas

Este archivo es informal, a propósito. No es documentación de arquitectura (eso vive en `DOCUMENTACION.md`) ni un registro de cambios (eso es `CHANGELOG.md`). Es el lugar donde guardamos cosas que costó descubrir y que vale la pena no volver a preguntar.

---

## 1. Terminal / Windows

### `&&` no funciona en PowerShell 5.1 (el que trae Windows por defecto)
Si escribes `npm run build && npm start` y da error raro, probablemente estás en PowerShell 5.1, no en pwsh 7+. Alternativas:
```powershell
npm run build; npm start        # siempre funciona, corre el 2do pase lo que pase con el 1ro
npm run build && npm start      # solo funciona en PowerShell 7+ (correr $PSVersionTable.PSVersion para confirmar)
```

### `+` no es un separador de comandos en ninguna terminal
Si escribes `npm run build + npm start`, npm le pasa el `+` como argumento extra a `next build`. Next.js lo interpreta como el nombre de una carpeta de proyecto (`next build [directorio]`), la busca, no existe, y truena con `Invalid project directory provided`. El error no tiene nada que ver con el código — es puro problema de sintaxis de terminal.

### `npm run dev` vs `npm run build`
- `npm run dev` → servidor de desarrollo local, compila al vuelo, hot reload, nunca se usa en producción, nunca lo corre Vercel.
- `npm run build` → genera el build de producción optimizado. Es EXACTAMENTE lo que Vercel corre en sus servidores cada vez que haces push a `master`. Si falla en tu máquina, falla igual en Vercel — por eso conviene correrlo localmente antes de subir cambios grandes.
- Para simular producción completa en tu máquina: `npm run build` y luego `npm start` (no `dev`).

---

## 2. Next.js — cosas que cambiaron de versión y generan warnings

### `middleware.ts` → `proxy.ts` (Next.js 16)
Next.js renombró la convención. El archivo se llama `proxy.ts` y la función exportada se llama `proxy` (no `middleware`). El viejo nombre sigue funcionando (deprecado, con warning) pero se va a eliminar en el futuro. Hay un codemod oficial: `npx @next/codemod@canary middleware-to-proxy .`

### `themeColor` va en `viewport`, no en `metadata`
```ts
// ❌ deprecado (genera warning, y probablemente ni se aplica)
export const metadata: Metadata = { themeColor: "#7C3AED" }

// ✅ correcto
export const viewport: Viewport = { themeColor: "#7C3AED" }
```

---

## 3. Git y flujo de trabajo

### Rama `dev` + Vercel Preview Deployments
Desde el 27/07, el flujo del proyecto es:
1. Todo cambio se hace en la rama `dev`, nunca directo en `master`.
2. Cada push a `dev` genera automáticamente un Preview Deployment en Vercel — una URL separada de producción (Vercel ya lo tiene activado por defecto: Settings → Environments → Preview = "All unassigned git branches").
3. Se prueba en esa URL de preview.
4. Solo cuando se confirma que está bien, se mergea `dev` → `master`, y ahí sí se actualiza lo que ven los clientes.

Comandos para mergear cuando esté listo:
```bash
git checkout master
git pull origin master
git merge dev
git push origin master
```

### `git mv` para renombrar archivos, no borrar+crear
Al renombrar (ej. `middleware.ts` → `proxy.ts`, o numerar los scripts SQL), usar `git mv` conserva el historial del archivo (`git log --follow` sigue funcionando). Borrar y crear uno nuevo con el mismo contenido rompe ese historial.

### Para saber cuándo se creó realmente un archivo (útil para ordenar/numerar cosas)
```bash
git log --follow --format=%ad --date=short -- ruta/al/archivo | tail -1
```
Da la fecha del primer commit, siguiendo renombres. Se usó para numerar los scripts de `database/` en el orden real en que se aplicaron, no por intuición.

---

## 4. Supabase — cosas del proyecto que no son obvias

### El trigger `handle_new_user` no existe en la base de datos real
A pesar de que en teoría debería crear el perfil automáticamente al registrar un usuario en `auth.users`, ese trigger no está en la DB de este proyecto. Por eso las API routes de creación de usuarios (`create-user`, `users/create`) crean el perfil **manualmente** después de `admin.createUser()`. Si algún día "arreglas" esto pensando que el trigger debería encargarse, vas a romper la creación de usuarios — revisa primero si el trigger realmente existe en tu instancia de Supabase.

### Bug real ya ocurrido: constraints CHECK duplicadas
`profiles.role` tuvo dos CHECK constraints al mismo tiempo (una autogenerada con roles viejos, otra manual con roles nuevos) — bloqueaba el registro de usuarios con roles válidos. Antes de correr un `ALTER TABLE ... ADD CONSTRAINT`, verificar primero con `\d+ nombre_tabla` en el SQL Editor si ya existe una constraint con ese propósito. Detalle completo en `database/README.md`.

### Los scripts SQL se corren a mano, no hay migraciones automatizadas
No hay Supabase CLI ni Prisma/Drizzle en este proyecto. Todo cambio de esquema se aplica manualmente en el SQL Editor de Supabase, en el orden documentado en `database/README.md`. Si agregas un script nuevo, numéralo siguiendo esa misma convención.

### El plan gratuito de Supabase pausa la base de datos por inactividad
Por eso existe `/api/ping` (endpoint público, sin auth) — está pensado para recibir pings periódicos de un servicio externo tipo UptimeRobot o cron-job.org cada 5 minutos, y así evitar que la BD se pause.

### Cuidado: el ambiente "Preview" de Vercel puede compartir base de datos con producción
Si las variables de entorno de Supabase son las mismas en "Production" y "Preview" (Vercel → Settings → Environment Variables), entonces cualquier prueba que hagas en la URL de preview de `dev` escribe datos reales en la misma base de datos que usan los clientes. Para aislar de verdad, haría falta un segundo proyecto de Supabase solo para pruebas.

---

## 5. Seguridad / patrones de este proyecto

### Verificación de super admin: usar el helper, no copiar el bloque
Antes había 5 rutas de API con el mismo bloque de "verificar sesión + `is_super_admin`" copiado y pegado. Ahora existe `src/lib/supabase/requireSuperAdmin.ts` — cualquier ruta admin nueva debe usar ese helper en vez de reescribir la validación desde cero (evita que una ruta nueva se quede sin protección por descuido).

### `SUPABASE_SERVICE_ROLE_KEY` solo en rutas de servidor (API routes)
Nunca debe llegar al cliente/navegador. Todas las operaciones administrativas (crear/borrar usuarios, borrar tenants) pasan por API routes en `src/app/api/admin/` que la usan del lado del servidor únicamente.

### Cálculo de precios: usar `src/lib/pricing.ts`, no reinventar la fórmula
`calculateBasePrice(costPrice, marginPercentage)` y `calculateFinalPrice(basePrice, taxPercentage)` son funciones puras con tests (`src/lib/pricing.test.ts`, 8 casos). Cualquier pantalla nueva que necesite calcular precio con margen o IVA debería importar de ahí, no reescribir `costo * (1 + margen/100)` de nuevo.

### Delay de 500ms después del login
El flujo de login espera 500ms antes de redirigir, para dar tiempo a que la sesión se propague y las políticas RLS puedan resolver correctamente el `tenant_id` del usuario. Si algún día se quita ese delay pensando que es innecesario, puede que la primera carga del dashboard falle por RLS.

### Control de módulos: dos capas de control
Los módulos del dashboard se controlan por DOS tablas independientes:
- `tenant_modules` (`is_active`) → "¿la app está activa para el negocio?" (pestaña Aplicaciones del admin).
- `role_permissions` (`can_access` por rol + módulo) → "¿qué rol tiene permiso de ver qué módulo?" (pestaña Permisos del admin).

Decisión de producto (emitida por el usuario 06/08): al activar un módulo, `toggleModule` concede automáticamente `can_access=true` a `role_permissions` **solo para el rol `admin`** (el super admin no configura roles de equipo; lo decide el propio admin del negocio después, manualmente). El resto de filas de rol se siguen editando a mano en la pestaña Permisos.

---

## 6. PENDIENTE — Ventas y notificaciones reales (en curso, 06/08)

La campanita de notificaciones del dashboard es 100% maqueta: badge "2" hardcodeado y alertas de "Stock Bajo"/"Nueva Venta" inventadas en el JSX de `src/app/dashboard/layout.tsx`. **No hay ninguna lógica real detrás.** Antes de construir notificaciones hay que arreglar la raíz del problema de datos:

### Lo que no existe hoy (confirmado por código el 06/08)
1. **El POS no guarda las ventas**: al "Facturar/Guardar" en `src/app/dashboard/pos/page.tsx` solo se llama `window.print()`. No hay `insert` en `sales` ni `sale_items`.
2. **El stock no se descuenta al vender**: `products.stock` solo cambia al cargar manualmente (nuevo/import). Por eso el inventario "Stock Bajo" no refleja ventas reales.
3. **No hay sistema de notificaciones**: ni tabla `notifications`, ni lógica. El "stock bajo" podría salir de leer `products` reales (tiene `stock` y `min_stock`), pero las ventas del día NO (porque no hay ventas guardadas).

### Plan acordado con el usuario (06/08)
- Crear un RPC server-side `recordSale` (función SQL `security definer`) que en UNA transacción: inserte en `sales` → `sale_items` → descuente `stock` de `products`. En Supabase multi-tenant NO se hacen inserts sueltos desde el cliente (violan atomicidad y RLS).
- Conectar el POS a ese RPC en Guardar/Facturar.
- Recién después construir la campanita con datos reales (stock bajo y, cuando haya ventas reales, ventas del día).

### Bloqueante antes de escribir el RPC
El esquema base de `sales` / `sale_items` / `products` **no está en `database/`** (viene de una base previa; los scripts de `001+` solo agregan policies, no crean esas tablas). **El usuario debe verificar las columnas exactas** en Supabase → SQL Editor con:
```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('sales', 'sale_items', 'products')
order by table_name, ordinal_position;
```
Sin eso no se puede escribir el RPC sin adivinar columnas. Esto quedó PENDIENTE al cerrar sesión el 06/08.

---

## 7. Antes de dar un cambio por terminado

Checklist rápido:
```bash
npm run build      # ¿compila sin errores ni warnings nuevos?
npm run test       # ¿pasan los 8 tests de pricing.ts?
npm run lint       # opcional, revisa reglas de estilo
```
Y si el cambio toca UI, probarlo también en el navegador (login sin sesión, con sesión normal, con sesión de super admin) — build y tests no prueban que la funcionalidad *se vea* bien.