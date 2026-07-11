import type { NextConfig } from "next";

// CSP pensada para lo que la app realmente usa: fetch propio (API routes),
// Supabase (opcional) y nada de scripts/estilos externos. 'unsafe-inline' en
// style-src es necesario porque Next.js inyecta estilos inline en dev y para
// algunos componentes; se revisa si se puede endurecer mas adelante.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el movil en la misma red WiFi.
  allowedDevOrigins: ["10.242.152.87", "192.168.0.18", "*.trycloudflare.com"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
