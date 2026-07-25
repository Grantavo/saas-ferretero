# SaaS Grupo Jenta

Sistema de gestión empresarial SaaS para Negocios. Inventario, punto de venta (POS), reportes y más, todo desde un solo software.

## Características

- **Inventario** — Control de stock, entrada/salida de productos, importación masiva
- **Punto de Venta (POS)** — Interfaz rápida para cobros con soporte de métodos de pago
- **Clientes** — Registro y gestión de clientes
- **Ventas** — Historial de ventas y reportes
- **Pagos** — Control de pagos realizados y pendientes
- **Módulos adicionales** — Calendario, tareas, chat, historial

## Stack Tecnológico

- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (Auth, Database, Storage)
- **Base de datos:** PostgreSQL con Row Level Security (RLS)
- **Autenticación:** Supabase Auth con soporte multi-tenant
- **Despliegue:** Vercel

## Arquitectura Multi-tenant

Cada ferretería (tenant) tiene sus propios datos aislados. El sistema soporta:

- Panel Super Admin para gestionar ferreterías, usuarios y módulos
- Roles por usuario: Dueño, Administrador, Vendedor, Bodega, Mercadeo
- Activación/desactivación de módulos por tenant

## Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
