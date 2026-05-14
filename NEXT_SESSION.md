# Notas para la Próxima Sesión

## 1. Prioridad Crítica: Aislar Datos de Inquilinos (Multi-tenancy RLS)
**Problema:** Existe un fallo grave en la separación de datos. Si un usuario de "Ferremax" inicia sesión, está viendo información de "Ferretodo".
**Plan de Acción:**
- Revisar las políticas de seguridad (Row Level Security - RLS) en la base de datos de Supabase.
- Verificar que las consultas en el Dashboard del cliente (`/app/dashboard/layout.tsx` y `page.tsx`) estén filtrando correctamente por el `tenant_id` del usuario logueado en lugar de traer la primera ferretería que encuentren.
- Asegurar que el contexto del usuario en React mantenga estrictamente su `tenant_id`.

## 2. Arquitectura de Distribución del SaaS
**Decisión pendiente:** Cómo van a acceder los clientes al software (Dominios, subdominios o portal único).

### Opción A: Portal Único (Recomendado para el MVP inicial)
- **URL:** `app.tu-dominio.com`
- **Cómo funciona:** Todos los clientes entran por el mismo enlace y usan la misma pantalla de login. El sistema identifica a qué ferretería pertenecen por su correo electrónico y les muestra solo sus datos.
- **Ventaja:** Cero configuraciones adicionales. Es exactamente lo que ya tenemos construido y funciona de inmediato.

### Opción B: Subdominios (Estándar SaaS Profesional)
- **URL:** `ferremax.tu-dominio.com` y `ferretodo.tu-dominio.com`
- **Cómo funciona:** Cada ferretería tiene su propia dirección personalizada. 
- **Ventaja:** Se ve mucho más corporativo y da confianza al cliente.
- **Desventaja:** Requiere configurar un "Wildcard" (`*.tu-dominio.com`) en tu proveedor de dominio e implementar un "Middleware" en Next.js para leer el subdominio antes de cargar la página. Es muy viable, pero toma un poco más de tiempo de desarrollo.

### Opción C: Dominios Propios (Premium)
- **URL:** `www.ferremax.com`
- **Cómo funciona:** El cliente compra su propio dominio y lo conecta a tu aplicación.
- **Ventaja:** Nivel máximo de marca blanca (White-label). Puedes cobrarlo como un extra muy costoso.
- **Desventaja:** Altamente complejo. Requiere configurar generación de certificados SSL dinámicos en el servidor.
