# Changelog — Últimos Cambios

## 25/07/2026

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
