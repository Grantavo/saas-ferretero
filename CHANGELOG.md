# Changelog — Últimos Cambios

## [dev] 06/08/2026

### Seguridad — remisión de auditoría (10 hallazgos, en marcha)
- **[CRÍTICO]** `database/007_fix_customers_rls.sql`: reescritas las policies de `customers` y demás tablas sin cláusula comodín (USING+WITH CHECK), aislamiento multi-tenant estricto. Antes la policy tenía una tautología que volvía visible todo.
- **[CRÍTICO]** `database/008_fix_profiles_privesc.sql`: se cierra la auto-escalación en `profiles` — solo el super admin escribe; el usuario normal no puede alterar `role`/`is_super_admin`/`tenant_id`.
- **[CRÍTICO]** `database/009_helper_functions.sql`: helpers `SECURITY DEFINER` (`is_super_admin`, `current_tenant_id`, `current_role`, `can_access_module`) que rompen la recursión infinita de RLS.
- **[ALTO]** Se eliminan las páginas bootstrap `src/app/setup/page.tsx` y `src/app/test-db/page.tsx` (el onboarding real es por `/admin`). `proxy.ts` ya protegía `/setup` y `/test-db`.
- **[ALTO]** Importación de inventario movida a API route server-side (`src/app/api/dashboard/inventory/import/route.ts`): el tenant se deriva del usuario autenticado (nunca de `select ... limit(1)`), parsing con `exceljs` (se elimina `xlsx`, que arrastra CVEs), límite de 5 MB / 5000 filas, insert con Service Role Key.
- **[MEDIO]** `src/lib/supabase/requireModule.ts`: chequeo de módulo por rol a nivel de ruta (defense in depth sobre las policies de `role_permissions`). Aplicado en la API de import de inventario (`inventory`).
- **[MEDIO]** `next.config.ts`: headers de seguridad (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS). CSP descomentada a activar con tests.
- **[MEDIO]** `src/lib/validation/password.ts` + `src/lib/security/rateLimit.ts`: política de contraseña (≥10) y rate-limit por IP. Aplicados en las 5 rutas de admin: `users/create`, `create-user`, `users/password`, `users/delete`, `delete-tenant`.
- **[MEDIO]** `database/010_audit_log.sql`: tabla de auditoría con RLS (solo super admin lee); insert desde las 5 rutas de admin (crear/eliminar usuarios, password, delete tenant).
- **Nota de monitoreo**: `npm audit` aún reporta vulns de `next` (incluye bypass de middleware con Turbopack — relevante al proxy) y deps de `next` (`sharp`, `postcss`); el fix requiere subir a `next 16.3.0` (fuera de rango). Se documenta por ahora; decisión de upgrade separada.

### Punto de Venta — búsqueda de cliente profesional
- `src/app/dashboard/pos/page.tsx`
- El dropdown del cliente ya no depende de escribir texto: se abre al **enfocar** el input y se cierra con **clic fuera**
- **Estado vacío** diferenciado: "Empieza a escribir para buscar" (sin texto) / "Sin resultados" (búsqueda sin match)
- **Navegación por teclado**: ↑/↓ para moverse, **Enter** selecciona, **Esc** cierra; el ítem activo se resalta y el hover se sincroniza con el teclado
- Cada cliente muestra **avatar con la inicial**, nombre, NIT y teléfono
- Al elegir, el placeholder del input muestra el nombre del cliente seleccionado (chip); tocar de nuevo permite cambiarlo sin borrar manualmente

### Punto de Venta — búsqueda de productos profesional
- Mismo tratamiento que la de cliente: dropdown al enfocar, cierre por clic fuera, estado vacío, navegación por teclado, resaltado del ítem activo
- La búsqueda ahora filtra por **nombre y marca** (antes solo nombre)
- Item con imagen/nombre/marca/precio y `min-w-0` para que los nombres largos no desborden

### Punto de Venta — icono de búsqueda centrado
- La lupa de productos quedaba ~8px arriba del centro porque el `relative` que la centraba también tenía el `pt-4`
- Solución: el `pt-4` se movió a un wrapper externo; el `relative` que posiciona el icono abraza solo el input → lupa alineada al centro real

### Punto de Venta — barra de búsqueda ya no es sticky
- Eliminado `sticky top-0 z-40 backdrop-blur-xl` del header de búsqueda; ahora es parte del flujo del documento y scrolle con la página en vez de quedar tapando el contenido

### Punto de Venta — cantidad y precios afinados
- **IVA dinámico**: el rótulo del pie ya no está hardcodeado al 19%; calcula `effectiveIvaRate = tax/subtotal` para reflejar la tasa real de los productos del carrito
- **Columnas consistentes**: la fila ahora muestra "Subtotal sin IVA", "IVA" (de la línea) y "Total". El pie usa "Subtotal (sin IVA)", "IVA (x%)" y "Total a pagar", de modo que cada total del pie corresponda a la suma de su columna de la tabla
- **Cantidad acotada**: input con `min={1}` y `Math.max(1, newQty)` en `updateQuantity` — nunca baja a 0 ni deja líneas fantasma

### Dashboard — fix definitivo de la barra de scroll lateral derecha
- Causa raíz: la home forceaba `min-h-screen` (pantalla completa) + header de 64px → el `body` siempre quedaba ~65px más alto que la ventana, generando barra vertical aunque no hubiera contenido que scrollear
- `src/app/dashboard/layout.tsx`: el contenedor raíz pasa de `min-h-screen` a `h-screen overflow-hidden`; el `<main>` (ya `overflow-y-auto`) es ahora el único que hace scroll
- `src/app/dashboard/page.tsx`: la home usa `min-h-[calc(100dvh-64px)]` para llenar el área visible bajo el header (64px) en vez de forzar pantalla completa
- Resultado: la home con contenido corto ya no muestra barra; el scroll vertical solo aparece cuando el contenido real la supera. El scroll horizontal (de abajo) ya había quedado resuelto con `overflow-x: clip` en `html/body` (27/07)

## [dev] 28/07/2026

### Cambio 1/3: activar módulo ahora concede permiso automático al rol admin
- Al activar una app en la pestaña "Aplicaciones", `grantAdminPermission` da acceso `can_access=true` al rol `admin` en `role_permissions`
- El resto de roles se configuran manualmente por el admin en la pestaña "Permisos"

### Cambio 2/3: el dashboard muestra exactamente los módulos activados para el rol
- `src/app/dashboard/page.tsx`: eliminado el fallback hardcodeado de 10 módulos (mostraba apps que el negocio no tenía activas)
- Eliminado el bypass que mostraba todos los activos cuando el rol no tenía permisos (violaba "ni uno más ni uno menos")
- Ahora siempre se aplica la intersección estricta: `tenant_modules(is_active=true)` ∩ `role_permissions(can_access=true del rol)`
- Rol sin permisos registrados → no ve nada
- Añadido estado vacío con mensaje ("No tienes módulos habilitados") en vez de página en blanco

### Cambio 3/3: íconos del dashboard siempre centrados
- `src/app/dashboard/page.tsx`: el contenedor de módulos pasa de `grid grid-cols-*` a `flex flex-wrap justify-center`
- Con la grilla, las filas parciales (1-5 módulos) quedaban alineadas a la izquierda; con flex + justify-center el grupo completo queda centrado sin importar la cantidad
- Sin cambios en los estilos de cada tile (tamaño, color, icono, hover)

### Fix: sin barra de scroll lateral en el dashboard
- `src/app/dashboard/layout.tsx`: `<main>` pasa de `overflow-auto` a `overflow-y-auto overflow-x-clip`
- `src/app/dashboard/layout.tsx`: contenedor raíz `overflow-x-clip` + `min-w-0` en el hijo flex
- `src/app/dashboard/page.tsx`: contenedor de la home con `overflow-x-clip`
- `src/app/globals.css`: `overflow-x: clip` en `html` y `body` (nivel raíz) — corta el desborde horizontal que venía del documento, sin romper `position: sticky` (por eso `clip` y no `hidden`)
- Elimina la barra lateral en la pantalla del negocio; el scroll vertical sigue normal

## 28/07/2026

### Fix: public/sw.js ahora se trackea en git
- Eliminado `public/sw.js` de `.gitignore`
- Antes el SW nunca se subía al repo ni se desplegaba a Vercel → 404 en `/sw.js` en producción
- Sin cambios en el contenido del archivo

### Fix: se excluyen /sw.js y /manifest.json del proxy de autenticación
- Agregados `sw.js` y `manifest.json` al matcher del proxy
- Corrige SecurityError al registrar Service Worker sin sesión activa
- Sin cambio en rutas protegidas (login/redirect sigue igual)

### Fix: se mueve themeColor de metadata a viewport export (Next.js API actual)
- Importado `Viewport` type junto a `Metadata` desde `next`
- `themeColor: "#7C3AED"` movido de `export const metadata` a `export const viewport`
- Sin cambio visual, elimina warning de deprecación en servidor

### Chore: migración de middleware.ts a proxy.ts (convención Next.js 16)
- `src/middleware.ts` → `src/proxy.ts` via `git mv`
- `export async function middleware()` → `export async function proxy()`
- Sin cambios en lógica, imports, rutas públicas, matcher ni cookies
- Build ya no muestra el warning de deprecación del middleware

### Test: se extrae lógica de cálculo de precios a src/lib/pricing.ts
- Nuevas funciones puras `calculateBasePrice` y `calculateFinalPrice` en `src/lib/pricing.ts`
- `inventory/new/page.tsx`: useEffect y display de precio final ahora llaman a las funciones
- `inventory/edit/[id]/page.tsx`: useEffect de IVA usa `calculateFinalPrice`, mantiene dos estados
- Vitest instalado como devDependency, 8 tests unitarios pasando
- Sin cambios de comportamiento numérico

## 25/07/2026

### Fix: se reduce logging con datos personales en rutas admin
- Eliminados `console.log` que exponían email, tenant_id y user.id en texto plano
- Todos los `console.error` ahora registran solo `error.message` en vez del objeto completo
- `delete-tenant` ya no registra `p.id` del usuario al fallar borrado
- Mensajes preservados: `Missing SUPABASE_SERVICE_ROLE_KEY` (sin datos personales)

### Fix: tipado seguro de errores (unknown) en rutas de API admin
- Reemplazados 5 `catch (err: any)` por `catch (err: unknown)` en los catch blocks
- Usa `err instanceof Error ? err.message : 'Error interno del servidor'` para mensajes
- Rutas afectadas: `create-user`, `delete-tenant`, `users/create`, `users/delete`, `users/password`
- Sin cambio de comportamiento observable

### Refactor: helper compartido requireSuperAdmin()
- Extraído el bloque duplicado de verificación de sesión + super admin en 5 rutas API
- Nuevo helper `src/lib/supabase/requireSuperAdmin.ts`
- Rutas afectadas: `create-user`, `delete-tenant`, `users/create`, `users/delete`, `users/password`
- Sin cambio de comportamiento: mismos mensajes y status codes que cada ruta tenía

### Fix: Perfiles no se creaban al crear usuarios
- Restaurada la creación manual del perfil en ambas API routes (`create-user`, `users/create`)
- Causa: el trigger `handle_new_user` no existe en la DB, el workaround de crear perfil manualmente es necesario
- Agregado `email` al insert del perfil para mostrarlo en el listado de usuarios

### Email visible en listado de usuarios
- Nueva columna `email` en `profiles` — correr `database/add_email_to_profiles.sql` en Supabase SQL Editor
- El email se guarda automáticamente al crear nuevos usuarios desde el admin
- Backfill para usuarios existentes vía `UPDATE profiles SET email = au.email FROM auth.users au`

### PWA — App instalable (manual SW, sin plugins de build)
- Service worker manual en `public/sw.js` (network-first con fallback a caché, compatible con Turbopack)
- `public/manifest.json`, iconos SVG, metatags en layout
- Componente `ServiceWorkerRegister.tsx` para registrar el SW desde el layout

### NIT, Teléfono, Dirección obligatorios
- `required` en inputs de creación y edición + validación extra en `handleSaveTenant`

### Toggle visibilidad en contraseña temporal
- Botón Eye/EyeOff al agregar usuario

### Fix: artifacto amarillo en hover
- Todos los `hover:opacity-90` → `hover:brightness-110`

## 24/07/2026

### Fix: Creación de usuarios — constraint duplicado en profiles.role
- Causa raíz: existían dos CHECK constraints sobre `profiles.role` — `profiles_role_check` (autogenerada, roles viejos) y `valid_roles` (roles nuevos). La constraint vieja rechazaba valores como `'admin'`.
- Solución: `database/fix_profiles_role_constraint.sql` elimina ambas constraints y recrea solo `valid_roles` con los 5 roles actuales.
- API routes revertidas al patrón original con trigger (el trigger funciona correctamente una vez eliminada la constraint duplicada).
- Agregado `console.error` con el error completo de Supabase en ambas API routes para diagnóstico futuro.

### Sistema de Notificaciones Toast
- Instalado **Sonner** como sistema de toasts profesional
- `<Toaster />` agregado en `admin/layout.tsx` con posición top-right, colores rich y botón de cerrar
- Reemplazado `alert()` nativo en `confirmDelete` por `toast.error()`
- Agregado feedback toast en cambio de estado (activar/desactivar negocio) con `toast.success()` / `toast.error()`

### Confirmación para Activar/Desactivar Negocio
- Nuevo modal de confirmación con ícono dinámico (Power/PowerOff), texto contextual y botón con color según acción (ámbar para desactivar, esmeralda para activar)
- Muestra advertencia sobre acceso de usuarios al desactivar

### Loading Skeletons
- Reemplazado spinner (`Loader2`) con 6 skeleton cards que imitan la forma real de las cards (avatar, texto, badges, footer)
- Usa clases `animate-pulse` de Tailwind, sin dependencias adicionales

### Migración completa de alertas a Toasts (Admin)
- **Sonner** instalado e integrado en `admin/layout.tsx` con Toaster global (top-right, richColors)
- `admin/tenants/page.tsx`: errores y confirmaciones migrados a toast + modales
- `admin/tenants/new/page.tsx`: errores a toast, alert de credenciales reemplazada por modal "Cuenta creada" con botón copiar email/contraseña
- `admin/tenants/[id]/page.tsx`: 8 alerts + 1 confirm reemplazados — errores a toast, successes a toast, credenciales a modal con copia, confirm de eliminar usuario a modal
- `admin/settings/page.tsx`: 5 alerts reemplazados por toast.success/error

### Lista de Negocios — Mejoras Visuales
- **Métricas** en cabecera: tarjetas de Total, Activos e Inactivos con conteo en tiempo real
- **Cards mejoradas**: ahora muestran fecha de creación, cantidad de usuarios y módulos activos por negocio
- **Modal de confirmación** personalizado para eliminar negocios (reemplaza `confirm()` nativo) con backdrop blur, ícono de advertencia y animación spring
- **Estados vacíos**: mensaje diferenciado cuando no hay negocios vs. cuando la búsqueda no da resultados
- **Paginación**: controles Anterior/Siguiente con números de página, 9 negocios por página, resetea al buscar
- Búsqueda ahora resetea la página actual a 1 al cambiar el término de búsqueda

## 23/07/2026

### Roles y Permisos
- Nueva tabla `role_permissions` (tenant_id, role, module_key, can_access) con RLS y función seed
- Matriz visual de permisos por rol en detalle del negocio (toggles por módulo × rol)
- Dashboard filtra módulos según `role_permissions.can_access` del rol del usuario
- Al crear un negocio, se genera automáticamente la configuración por defecto de permisos
- Soporte para tenants sin migrar (si no hay permisos, se muestran todos los módulos)

### Panel de Administración — Rediseño con Tabs
- Detalle del negocio reorganizado en pestañas: Información | Aplicaciones | Usuarios | Permisos
- Hero del negocio siempre visible con nombre, NIT, teléfono, badge de estado activo
- Transiciones animadas al cambiar de pestaña
- Pestaña "Información" con vista de datos y formulario editable

### Sidebar Colapsable (Admin)
- Sidebar se colapsa a iconos (w-20) con botón toggle en la cabecera
- En mobile (< lg): sidebar se oculta y abre como drawer overlay con backdrop blur
- Animación spring al abrir/cerrar el drawer en mobile
- Body scroll bloqueado cuando el drawer mobile está abierto
- Menú hamburguesa en la topbar para mobile
- Tooltips nativos en los iconos cuando está colapsado

### Responsive Design
- Admin layout: padding responsivo (`p-4 sm:p-6 lg:p-8`)
- Dashboard layout: dropdowns con `max-w-[calc(100vw-2rem)]` para evitar desbordes
- Dashboard layout: padding responsivo y header con `px-4 sm:px-6`
- Chat: vista mobile con lista/mensajes separados (no side-by-side), botón de retroceso
- Grilla de permisos con `overflow-x-auto` + `min-w-[680px]` para scroll horizontal
- Grids `grid-cols-2` sin breakpoint corregidos a `grid-cols-1 sm:grid-cols-2`
- Footer `md:row` corregido a `md:flex-row`
- Tamaños de fuente/iconos/padding escalan con breakpoints sm/md/lg en varias páginas

### Settings (Admin)
- Eliminado import no usado de `Settings`
- `fetchProfile` movida antes del `useEffect` para evitar warning de hoisting
- `catch (error: any)` cambiado a `catch (error: unknown)` con validación `instanceof Error`

## 21/07/2026

### Login
- Agregada barra superior con logo (GrupoJenta) y botón "Contáctanos" a WhatsApp
- Botón con borde gris, efecto hover a slate-600
- Formulario más compacto (menos padding, textos más pequeños) para evitar scroll
- Agregado toggle mostrar/ocultar contraseña (ícono de ojo)
- Formulario reposicionado más arriba en la página
- Eliminado enlace del ícono de martillo dentro del formulario
- Mejorado el mapeo de errores de autenticación

### Panel de Administración
- Renombrado "Ferreterías" → "Negocios" en sidebar, títulos, botones y KPIs
- Roles de usuario traducidos al español (Dueño, Admin, Vendedor, Bodega, Mercadeo)

### Layout
- Agregado contenedor max-width centrado (`max-w-7xl`) en admin y dashboard para mejor presentación en monitores grandes

### Nuevos Archivos
- `src/app/api/ping/route.ts` — Endpoint de health check para mantener BD activa
- `DOCUMENTACION.md` — Documentación profesional del proyecto
- `CHANGELOG.md` — Este archivo

### Infraestructura
- Middleware actualizado para permitir `/api/ping` como ruta pública
- `.gitignore` actualizado con archivos privados de desarrollo
- Archivos `.agent/`, `ejecutar_comandos.md`, `reglas_de_cambio.md`, `NEXT_SESSION.md` eliminados del tracking de git
- `README.md` reescrito con información real del proyecto
