import type { NextConfig } from "next";

// CSP sin nonce, a proposito. El nonce por peticion (via proxy.ts) se probo
// primero y parecia mas estricto, pero segun la propia documentacion de
// Next.js el nonce SOLO se aplica en paginas renderizadas dinamicamente por
// peticion: Next.js inyecta el nonce en el HTML durante el render, y no
// puede hacerlo en paginas estaticas pregeneradas en build time (que es
// justo lo que son / , /settings y /history aqui). El header con el nonce
// quedaba correcto, pero el HTML servido (generado una vez en el build) no
// llevaba ningun atributo nonce en sus scripts inline, asi que seguian
// bloqueados en produccion pese a que el fix parecia funcionar en dev
// (donde Next.js SI renderiza cada pagina por peticion). Forzar render
// dinamico en todas las paginas para poder usar nonce tiene un coste real
// (sin cache de CDN, sin optimizacion estatica) que no compensa para esta
// app. 'unsafe-inline' en script-src es la alternativa que Next.js
// documenta explicitamente para quien no quiere ese coste; el payload RSC
// que Next.js necesita inyectar inline no puede hidratar sin esto. XSS via
// contenido generado por el modelo ya esta cubierto aparte: no hay ningun
// dangerouslySetInnerHTML en la app, asi que ese contenido siempre se
// renderiza como texto escapado por React, nonce o no.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
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
