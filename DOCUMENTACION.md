# GrupoJenta — ERP SaaS

**Plataforma de gestión empresarial SaaS para negocios que buscan organizar su operación y mantenerla al día.**

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Módulos del Sistema](#5-módulos-del-sistema)
6. [Portal de Administración](#6-portal-de-administración)
7. [Autenticación y Roles](#7-autenticación-y-roles)
8. [Modelo de Datos](#8-modelo-de-datos)
9. [API de Administración](#9-api-de-administración)
10. [Seguridad y RLS](#10-seguridad-y-rls)
11. [Experiencia de Usuario](#11-experiencia-de-usuario)
12. [Guía de Despliegue](#12-guía-de-despliegue)
13. [Configuración de Entorno](#13-configuración-de-entorno)

---

## 1. Resumen Ejecutivo

**GrupoJenta** es un sistema SaaS (Software as a Service) diseñado para la gestión integral de cualquier tipo de negocio. Proporciona herramientas para control de inventario, punto de venta, administración de clientes, reportes y más, todo desde una plataforma unificada en la nube.

### Propósito

Digitalizar y centralizar la operación de cualquier negocio, permitiendo a dueños y empleados gestionar su empresa desde cualquier dispositivo con acceso a internet.

### Modelo de Negocio

- **Multi-tenant**: Cada negocio (tenant) opera con sus propios datos aislados.
- **Suscripciones**: Planes basados en período (trial, básico, pro, enterprise).
- **Panel Super Admin**: Gestión centralizada de todos los negocios, usuarios y módulos.

### Beneficios Clave

- Reducción de pérdidas por inventario desorganizado
- Velocidad en el proceso de venta con POS integrado
- Toma de decisiones basada en reportes en tiempo real
- Acceso desde cualquier lugar (cloud-native)
- Costo accesible con modelo SaaS

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.6 |
| **Lenguaje** | TypeScript | 5.x |
| **UI Library** | React | 19.2.4 |
| **Estilos** | Tailwind CSS | v4 |
| **Animaciones** | Framer Motion | 12.38.0 |
| **Iconos** | Lucide React | 1.14.0 |
| **Backend / DB** | Supabase | — |
| **Autenticación** | Supabase Auth | — |
| **Base de Datos** | PostgreSQL | — |
| **ORM / Cliente DB** | Supabase JS Client | 2.105.4 |
| **Importación datos** | xlsx, papaparse | — |
| **Notificaciones** | Sonner (toasts) | 2.0.7 |
| **Utilidades CSS** | clsx, tailwind-merge | — |
| **Despliegue** | Vercel | — |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Navegador)                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Landing  │  │  Login   │  │ Dashboard│  │ Admin Panel│  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Next.js (App Router)                       │
│                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ Páginas (pages)│  │ API Routes (api)│  │  Middleware   │  │
│  │   (Client)     │  │   (Server)      │  │   (Auth)     │  │
│  └────────────────┘  └─────────────────┘  └──────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Supabase (Backend)                        │
│                                                             │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  Auth (Auth)   │  │ Database (SQL)  │  │   Storage    │  │
│  │  · Users       │  │  · Tables       │  │  · Product   │  │
│  │  · Sessions    │  │  · RLS Policies │  │    Images    │  │
│  │  · Admin API   │  │  · Triggers     │  └──────────────┘  │
│  └────────────────┘  └─────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

### Flujo de Autenticación

```
Usuario → Login → Supabase Auth → Sesión (cookie) → Middleware verifica → 
  → ¿Super Admin? → /admin
  → ¿Usuario normal? → /dashboard
  → ¿No autenticado? → /login
```

### Aislamiento Multi-tenant

Cada tenant tiene sus datos aislados mediante **Row Level Security (RLS)** de PostgreSQL. Las políticas RLS filtran automáticamente por `tenant_id` según el perfil del usuario autenticado. Los super admins pueden ver todos los tenants.

---

## 4. Estructura del Proyecto

```
saas-ferretero/
├── .env.local                   # Variables de entorno (local, no en repo)
├── .env.local.example           # Template de variables de entorno
├── .gitignore
├── next.config.ts               # Configuración de Next.js
├── tailwind.config.ts           # Configuración de Tailwind
├── tsconfig.json                # TypeScript config (alias @/ → src/)
├── package.json
│
├── public/                      # Assets estáticos
│   └── (svg, favicon)
│
└── src/
    ├── middleware.ts             # Protección de rutas (auth + roles)
    │
    ├── app/
    │   ├── globals.css          # Tema, colores, estilos base
    │   ├── layout.tsx           # Layout raíz (Provider, Toaster)
    │   ├── page.tsx             # Landing page pública
    │   │
    │   ├── login/               # Autenticación
    │   │   └── page.tsx
    │   │
    │   ├── auth/
    │   │   └── callback/        # Callback OAuth
    │   │
    │   ├── dashboard/           # Portal del cliente (tenant)
    │   │   ├── layout.tsx       # Top bar + navegación
    │   │   ├── page.tsx         # Lanzador de módulos
    │   │   ├── inventory/       # Módulo de inventario
    │   │   ├── pos/             # Punto de venta
    │   │   ├── sales/           # Historial de ventas
    │   │   ├── customers/       # Clientes
    │   │   ├── payments/        # Pagos y cuentas por cobrar
    │   │   ├── history/         # Historial de actividad
    │   │   ├── chat/            # Mensajería interna
    │   │   ├── calendar/        # Agenda de entregas
    │   │   ├── tasks/           # Gestión de tareas
    │   │   └── settings/        # Configuración del tenant
    │   │
    │   ├── admin/               # Panel Super Admin
    │   │   ├── layout.tsx       # Sidebar + top bar
    │   │   ├── page.tsx         # Dashboard con KPIs
    │   │   ├── tenants/         # Gestión de negocios
    │   │   │   ├── page.tsx     # Listado de tenants
    │   │   │   ├── new/         # Wizard de creación
    │   │   │   └── [id]/        # Detalle del tenant
    │   │   └── settings/        # Perfil del super admin
    │   │
    │   ├── setup/               # Configuración inicial
    │   ├── test-db/             # Prueba de conexión
    │   │
    │   └── api/                 # API Routes
    │       ├── ping/            # Health check
    │       └── admin/
    │           ├── create-user/
    │           ├── delete-tenant/
    │           └── users/
    │               ├── create/
    │               ├── delete/
    │               └── password/
    │
    ├── components/
    │   └── layout/
    │       └── sidebar.tsx      # Componente de sidebar (disponible)
    │
    ├── lib/
    │   ├── utils.ts             # Función cn() para clases condicionales
    │   └── supabase/
    │       ├── client.ts        # Cliente Supabase (navegador)
    │       ├── server.ts        # Cliente Supabase (servidor)
    │       ├── customers_schema.sql
    │       └── database_v2.sql  # Esquema completo multi-tenant
    │
    └── providers/
        └── UserContext.tsx      # Contexto de auth global
```

---

## 5. Módulos del Sistema

El dashboard del cliente presenta un lanzador de aplicaciones con los siguientes módulos, cada uno activable/desactivable por el super admin por tenant:

| Módulo | Clave | Descripción | Activo por defecto |
|--------|-------|-------------|-------------------|
| **Inventario** | `inventory` | Gestión de productos, stock, importación masiva | ✅ |
| **Punto de Venta** | `pos` | Interfaz de cobro con búsqueda de productos y clientes | ✅ |
| **Ventas** | `sales` | Historial de ventas, KPIs, reportes | ✅ |
| **Clientes** | `customers` | Directorio de clientes con métricas individuales | ✅ |
| **Pagos** | `payments` | Cuentas por cobrar, registro de pagos | ❌ |
| **Historial** | `history` | Línea de tiempo de actividad | ❌ |
| **Conversaciones** | `chat` | Mensajería interna entre usuarios del tenant | ❌ |
| **Calendario** | `calendar` | Agenda de entregas | ❌ |
| **Tareas** | `tasks` | Gestión de tareas pendientes | ❌ |
| **Ajustes** | `settings` | Configuración del negocio | ✅ |

### 5.1 Inventario

Gestión completa de productos con las siguientes funcionalidades:

- **CRUD de productos**: Crear, editar, eliminar productos
- **Campos**: nombre, marca, categoría, código de barras, SKU, precio de costo, margen, precio base, IVA (19%), stock, stock mínimo
- **Cálculo automático de precios**: El precio base se calcula desde el costo + margen, o el margen se calcula desde el precio base
- **Imágenes**: Subida a Supabase Storage por producto
- **Importación masiva**: Carga de productos desde Excel (.xlsx) y CSV con procesamiento en lotes de 50
- **Búsqueda**: Por nombre, SKU o código de barras

### 5.2 Punto de Venta (POS)

Interfaz de cobro optimizada para velocidad:

- **Selectores**: Búsqueda de clientes y productos con autocompletado
- **Carrito de compras**: Gestión de cantidades, precios con/sin IVA
- **Tipos de documento**: Cotización (con fecha de expiración) y Factura
- **Totales**: Subtotal, IVA (19%), total general
- **Impresión**: Vista optimizada para impresión
- **Formato moneda**: Pesos colombianos (COP)

### 5.3 Clientes

Directorio centralizado de clientes:

- **Registro**: Creación de clientes con normalización automática de datos
- **Campos**: nombre completo, NIT/CC, email, teléfono, dirección
- **Validaciones**: NIT solo numérico, teléfono máx. 10 dígitos, email minúsculas
- **Búsqueda**: Por nombre o NIT

### 5.4 Ventas

Historial y métricas de ventas:

- **Indicadores**: Ingresos totales, facturas generadas, IVA recaudado
- **Listado**: Tabla con ID, fecha, método de pago, total
- **Exportación**: Botón de exportar reporte

### 5.5 Otros Módulos

- **Pagos**: Seguimiento de cuentas por cobrar con filtros (todos, pagados, pendientes)
- **Historial**: Línea de tiempo de actividad del negocio
- **Chat**: Sistema de mensajería interna con indicador de lectura
- **Calendario**: Vista mensual de agenda con eventos y entregas programadas
- **Tareas**: Lista de tareas con prioridades (urgente, media, baja)

---

## 6. Portal de Administración

El panel de super admin (`/admin`) permite la gestión centralizada de toda la plataforma.

### 6.1 Dashboard de KPIs

Indicadores globales del sistema:
- Ferreterías activas
- Usuarios totales registrados
- Productos registrados en el sistema
- Ventas realizadas

### 6.2 Gestión de Negocios (Tenants)

#### Listado (`/admin/tenants`)
- Búsqueda por nombre o NIT
- Grid de tarjetas con nombre, NIT, estado (activa/inactiva), fecha de registro
- Acciones: Gestionar, Activar/Desactivar, Eliminar

#### Creación (`/admin/tenants/new`)
Wizard de 2 pasos:
1. **Datos de la empresa**: nombre, NIT, teléfono, dirección → crea el tenant en BD
2. **Usuario administrador**: nombre, email, contraseña → crea usuario owner auto-confirmado

#### Detalle (`/admin/tenants/[id]`)
- **Información del tenant**: edición inline de nombre, NIT, teléfono, dirección
- **Módulos**: Interfaz tipo app manager (estilo Odoo) para activar/desactivar módulos
- **Usuarios**: CRUD completo de usuarios del tenant
  - Listado con roles (Dueño, Administrador, Vendedor, Bodega, Mercadeo)
  - Edición de rol, email y contraseña
  - Eliminación de usuarios

### 6.3 Configuración del Super Admin (`/admin/settings`)

- Edición de perfil (nombre, email)
- Cambio de contraseña personal

---

## 7. Autenticación y Roles

### 7.1 Sistema de Roles

| Rol | Clave | Descripción |
|-----|-------|-------------|
| Super Admin | `is_super_admin=true` | Acceso total a la plataforma, gestión de todos los tenants |
| Dueño | `owner` | Acceso completo a su negocio |
| Administrador | `admin` | Gestión administrativa del tenant |
| Vendedor | `seller` | Operaciones de venta e inventario |
| Bodega | `warehouse` | Gestión de inventario y stock |
| Mercadeo | `marketing` | Acceso a módulos de cliente y reportes |

### 7.2 Flujo de Login

1. El usuario ingresa email + contraseña
2. Supabase Auth valida las credenciales
3. Se consulta el perfil para determinar el rol
4. Redirección:
   - **Super Admin** → `/admin`
   - **Usuario de tenant** → `/dashboard`
5. Delay de 500ms para propagación de sesión RLS

### 7.3 Protección de Rutas (Middleware)

```
Cualquier ruta → ¿Ruta pública? (/, /login, /auth/*, /api/ping) → Permitir
               → ¿Usuario autenticado? → No → Redirigir a /login
               → ¿Ruta /admin? → ¿Super Admin? → Sí → Permitir
                                → No → Redirigir a /dashboard
               → Permitir
```

---

## 8. Modelo de Datos

### 8.1 Esquema de Base de Datos

#### Tabla: `tenants`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `name` | TEXT NOT NULL | Nombre del negocio |
| `nit` | TEXT | NIT |
| `address` | TEXT | Dirección |
| `phone` | TEXT | Teléfono |
| `business_name` | TEXT | Razón social |
| `email` | TEXT | Correo de contacto |
| `is_active` | BOOLEAN (true) | Estado de actividad |
| `created_at` | TIMESTAMPTZ | Fecha de registro |

#### Tabla: `profiles`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK (FK → auth.users) | ID del usuario (igual que auth.users) |
| `full_name` | TEXT | Nombre completo |
| `tenant_id` | UUID (FK → tenants) | Ferretería a la que pertenece |
| `role` | TEXT (default: seller) | Rol del usuario |
| `is_super_admin` | BOOLEAN (false) | Acceso global |
| `created_at` | TIMESTAMPTZ | Fecha de registro |

#### Tabla: `products`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Ferretería propietaria |
| `name` | TEXT | Nombre del producto |
| `brand` | TEXT | Marca |
| `category` | TEXT | Categoría |
| `barcode` | TEXT | Código de barras |
| `sku` | TEXT | SKU |
| `image_url` | TEXT | URL de imagen |
| `cost_price` | NUMERIC | Precio de costo |
| `base_price` | NUMERIC | Precio base de venta |
| `margin_percentage` | NUMERIC | Margen (%) |
| `tax_percentage` | NUMERIC (19) | IVA (%) |
| `stock` | INTEGER | Cantidad en inventario |
| `min_stock` | INTEGER | Stock mínimo |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

#### Tabla: `sales`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Ferretería |
| `total_amount` | NUMERIC | Total de la venta |
| `total_tax` | NUMERIC | IVA total |
| `payment_method` | TEXT | Método de pago |
| `customer_id` | UUID (FK → customers) | Cliente |
| `created_at` | TIMESTAMPTZ | Fecha de venta |

#### Tabla: `sale_items`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `sale_id` | UUID (FK → sales) | Venta asociada |
| `product_id` | UUID (FK → products) | Producto vendido |
| `quantity` | INTEGER | Cantidad |
| `unit_price` | NUMERIC | Precio unitario |
| `line_total` | NUMERIC | Total del ítem |

#### Tabla: `customers`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Ferretería |
| `full_name` | TEXT NOT NULL | Nombre completo |
| `id_number` | TEXT | NIT o CC |
| `email` | TEXT | Correo electrónico |
| `phone` | TEXT | Teléfono |
| `address` | TEXT | Dirección |
| `created_at` | TIMESTAMPTZ | Fecha de registro |
| `updated_at` | TIMESTAMPTZ | Última actualización |

#### Tabla: `tenant_modules`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `tenant_id` | UUID (FK → tenants) | Ferretería |
| `module_key` | TEXT NOT NULL | Clave del módulo |
| `module_name` | TEXT NOT NULL | Nombre del módulo |
| `is_active` | BOOLEAN (false) | Estado del módulo |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Unique**: `(tenant_id, module_key)`

#### Tabla: `subscriptions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `tenant_id` | UUID (FK → tenants, UNIQUE) | Ferretería |
| `plan` | TEXT (default: trial) | Plan: trial, basic, pro, enterprise |
| `status` | TEXT (default: active) | Estado: active, inactive, suspended |
| `started_at` | TIMESTAMPTZ | Inicio de suscripción |
| `expires_at` | TIMESTAMPTZ | Fin de suscripción (trial: 30 días) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### 8.2 Triggers y Funciones

- **`handle_new_user()`**: Crea automáticamente un perfil en `profiles` cuando se registra un nuevo usuario en `auth.users`
- **`create_default_modules(p_tenant_id)`**: Inserta los 10 módulos con sus estados por defecto para un nuevo tenant
- **`update_customers_updated_at`**: Actualiza `updated_at` en `customers` automáticamente

---

## 9. API de Administración

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/ping` | GET | Pública | Health check de la BD |
| `/api/admin/create-user` | POST | Super Admin | Crear usuario auth auto-confirmado |
| `/api/admin/delete-tenant` | DELETE | Super Admin | Eliminar tenant y todos sus usuarios |
| `/api/admin/users/create` | POST | Super Admin | Crear usuario bajo un tenant |
| `/api/admin/users/delete` | POST | Super Admin | Eliminar usuario de auth |
| `/api/admin/users/password` | POST | Super Admin | Cambiar contraseña/email de usuario |

Todas las rutas de administración verifican:
1. Que el usuario esté autenticado
2. Que tenga `is_super_admin = true`
3. Usan `SUPABASE_SERVICE_ROLE_KEY` para operaciones privilegiadas

---

## 10. Seguridad y RLS

### 10.1 Row Level Security

Todas las tablas tienen políticas RLS que implementan:

```
tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
OR
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
```

Esto garantiza que:
- Los usuarios solo ven datos de su propio negocio
- Los super admins tienen visibilidad global
- No es posible acceder a datos de otros tenants aunque se manipule el cliente

### 10.2 Autenticación

- Las contraseñas se almacenan **hasheadas** en Supabase Auth (nunca accesibles vía SQL)
- El login usa `signInWithPassword` de Supabase
- Las operaciones administrativas usan `SUPABASE_SERVICE_ROLE_KEY` (solo del lado del servidor)
- Tokens JWT manejados por Supabase con cookies HTTP-only

### 10.3 Buenas Prácticas

- Variables de entorno para todas las credenciales (`.env.local` ignorado por git)
- Cliente anónimo para operaciones del lado del cliente (RLS activo)
- Service Role Key solo en API routes del servidor
- Sin hardcoding de URLs o tokens en el código fuente

---

## 11. Experiencia de Usuario

### 11.1 Diseño Visual

- **Paleta de colores**: Tonos verdes sage como color primario, violeta para acentos de administración, fondos cálidos off-white
- **Tipografía**: Inter, uso intensivo de pesos bold y black para jerarquía visual
- **Esquinas redondeadas**: Bordes grandes (24px-40px) para un aspecto moderno
- **Sombreado**: Sombras múltiples y sutiles para profundidad
- **Estilo general**: Limpio, profesional, adaptado al mercado colombiano

### 11.2 Animaciones

- Transiciones de página con fade + slide (Framer Motion)
- Aparición escalonada de tarjetas y elementos
- Efectos hover con escala y cambios de color suaves
- Modales con animación de entrada (escala + opacidad)
- Spinners en estados de carga

### 11.3 Estados de UI

Cada página implementa los siguientes estados:
- **Carga**: Loader con spinner animado
- **Vacío**: Mensaje e icono indicando que no hay datos
- **Error**: Alertas con mensajes descriptivos (sonner toasts)
- **Éxito**: Confirmaciones visuales

### 11.4 Responsive Design

- Grids adaptables (1-6 columnas según resolución)
- Navegación adaptable para móvil y escritorio
- Sidebar de administración fija en escritorio

---

## 12. Guía de Despliegue

### 12.1 Requisitos

- Node.js 18+
- Cuenta en Supabase (gratuita)
- Cuenta en Vercel (gratuita)
- Repositorio Git (GitHub)

### 12.2 Configuración Inicial

```bash
# Clonar el repositorio
git clone https://github.com/Grantavo/saas-ferretero.git
cd saas-ferretero

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con las credenciales de Supabase
```

### 12.3 Configuración de Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el schema SQL de `src/lib/supabase/database_v2.sql` en el SQL Editor
3. Ejecutar `src/lib/supabase/customers_schema.sql`
4. Configurar Authentication → Settings → confirmar email desactivado (para creación directa de usuarios)
5. Obtener las credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Project Settings → API → Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY` → Project Settings → API → Service Role Key

### 12.4 Despliegue en Vercel

1. Conectar el repositorio de GitHub a Vercel
2. Configurar las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Desplegar (deploy automático en cada push a master)
4. Configurar dominio personalizado (opcional)

### 12.5 Mantenimiento

Para evitar la pausa por inactividad de Supabase (plan gratuito), el endpoint `/api/ping` debe recibir peticiones periódicas. Configurar:

1. **UptimeRobot** (gratuito): Monitor HTTP a `https://tudominio.com/api/ping` cada 5 minutos
2. O alternativas: cron-job.org, GitHub Actions, Cron-job.org

---

## 13. Configuración de Entorno

### 13.1 Variables de Entorno

```env
# Obligatorias
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...              # Anon Key (pública, segura con RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJ...                  # Service Role Key (solo servidor, ¡no exponer!)
```

### 13.2 Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build de producción
npm start        # Servir build de producción
npm run lint     # Análisis de código
```

---


