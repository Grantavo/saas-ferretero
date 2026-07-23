# Plan: Control de Acceso por Roles

---

## 1. Objetivo

Cada usuario solo pueda ver y acceder a los módulos (apps) que su rol tenga permitidos, configurable desde el panel de Admin por cada negocio.

---

## 2. Estado Actual

| Qué existe | Detalle |
|---|---|
| `tenant_modules` | Módulos del sistema activos/inactivos por negocio |
| `profiles.role` | Rol del usuario: admin, accounting, seller, warehouse, marketing |
| Dashboard | Muestra todos los módulos activos del tenant sin filtrar por rol |

**Problema:** Hoy si un módulo está activo en el negocio, cualquier usuario del negocio lo ve. No hay restricción por rol.

---

## 3. Cambios en Base de Datos

### Nueva tabla: `role_permissions`

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','accounting','seller','warehouse','marketing')),
  module_key TEXT NOT NULL,
  can_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, role, module_key)
);
```

**RLS:** Super admin full access; usuarios del tenant solo lectura.

### Función de seed

Al crear un tenant nuevo, insertar permisos por defecto:

| Módulo | admin | accounting | seller | warehouse | marketing |
|--------|:-----:|:----------:|:------:|:---------:|:---------:|
| Inventario | ✅ | ❌ | ✅ | ✅ | ❌ |
| Punto de Venta | ✅ | ❌ | ✅ | ❌ | ❌ |
| Ventas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Pagos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Historial | ✅ | ❌ | ❌ | ❌ | ❌ |
| Conversaciones | ✅ | ❌ | ❌ | ❌ | ✅ |
| Calendario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tareas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ajustes | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Interfaz de Admin

### Nueva sección en detalle del negocio: "Permisos por Rol"

Diseño visual:

```
┌─────────────────────────────────────────────────────────────┐
│  [Lock] Permisos por Rol                                    │
│  Define qué apps puede usar cada perfil de usuario          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────[Admin]──────┐  ┌───[Contabilidad]───┐             │
│  │  Inventario  ✅   │  │  Inventario  ❌   │             │
│  │  POS         ✅   │  │  POS         ❌   │             │
│  │  Ventas      ✅   │  │  Ventas      ✅   │             │
│  │  Clientes    ✅   │  │  Clientes    ✅   │             │
│  │  ...         ✅   │  │  ...         ❌   │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                             │
│  ┌─────[Ventas]──────┐  ┌─────[Bodega]──────┐              │
│  │  Inventario  ✅   │  │  Inventario  ✅   │             │
│  │  POS         ✅   │  │  POS         ❌   │             │
│  │  ...         ❌   │  │  ...         ❌   │             │
│  └────────────────────┘  └────────────────────┘             │
│                                                             │
│  ┌────[Mercadeo]─────┐                                      │
│  │  Clientes    ✅   │                                      │
│  │  Chat        ✅   │                                      │
│  │  ...         ❌   │                                      │
│  └────────────────────┘                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Especificaciones visuales:**
- Grid de tarjetas, una por rol existente en el sistema
- Cada tarjeta muestra el nombre del rol y un toggle por cada módulo
- Toggle animado (on/off) con color verde/gris
- Buscador/filtro rápido de módulos (opcional)
- Botón "Guardar cambios" con feedback de sonner toast
- Los cambios se aplican en tiempo real al dashboard del usuario

**Ubicación:** Nueva pestaña en la página de detalle del negocio, junto a "Aplicaciones" y "Usuarios", o como una sección expandible debajo de los módulos.

```
┌──────────────────────────────────────────────────────────────┐
│  [Aplicaciones]  [Usuarios]  [Permisos por Rol] ← Nueva     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
```
---

## 5. Dashboard — Filtrado Final

El dashboard debe mostrar solo los módulos donde:
1. `tenant_modules.is_active = true` (el módulo está activo en el negocio)
2. `role_permissions.can_access = true` (el rol del usuario tiene permiso)

Consulta final:

```sql
SELECT m.* FROM tenant_modules m
JOIN role_permissions rp 
  ON rp.tenant_id = m.tenant_id 
  AND rp.module_key = m.module_key
  AND rp.role = '{{ROL_DEL_USUARIO}}'
WHERE m.tenant_id = '{{TENANT_ID}}'
  AND m.is_active = true
  AND rp.can_access = true;
```

Si un módulo no tiene registro en `role_permissions`, se trata como denegado.

---

## 6. Resumen de Archivos a Modificar/Crear

| Archivo | Acción |
|---|---|
| `src/lib/supabase/role_permissions.sql` | Crear (schema de la nueva tabla) |
| `src/app/api/admin/role-permissions/route.ts` | Crear (API para CRUD de permisos) |
| RPC `create_default_role_permissions` | Crear (seed de permisos por defecto) |
| `src/app/admin/tenants/[id]/page.tsx` | Modificar (agregar sección o pestaña) |
| `src/app/dashboard/page.tsx` | Modificar (filtrar por rol) |
| `src/providers/UserContext.tsx` | Modificar (opcional, exponer rol) |

---

## 7. Tiempo Estimado

| Fase | Días |
|---|---|
| DB schema + seed + migración | 1 |
| API de permisos | 1 |
| UI de admin (tarjetas, toggles, pestañas) | 2 |
| Integración con dashboard | 1 |
| Pruebas y ajustes | 1 |
| **Total** | **6** |
