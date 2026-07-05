import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el movil en la misma red WiFi.
  allowedDevOrigins: ["10.242.152.87", "192.168.0.18", "*.trycloudflare.com"],
};

export default nextConfig;
