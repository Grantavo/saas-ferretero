# Changelog — Últimos Cambios

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
