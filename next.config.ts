import type { NextConfig } from "next";

// El resto de cabeceras de seguridad (no dependen de un valor por peticion,
// a diferencia del CSP con nonce, que vive en src/middleware.ts).
const securityHeaders = [
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
