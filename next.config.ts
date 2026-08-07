import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers de seguridad HTTP — cierre del hallazgo [MEDIO].
  // CSP se incluye desactivada por defecto: habilitarla estricta puede
  // romper el CSS/scripts inyectados por Next (estilos inline). Para
  // activarla, descomentar la línea `contentSecurityPolicy` y
  // re-testeando todo el flujo (login, dashboard, claves, POS).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // { key: "Content-Security-Policy",
          //   value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          //     "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
          //     "font-src 'self' data:; connect-src 'self' https://*.supabase.co; " +
          //     "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;