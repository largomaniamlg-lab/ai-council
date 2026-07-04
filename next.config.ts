import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde el movil en la misma red WiFi.
  allowedDevOrigins: ["10.242.152.87"],
};

export default nextConfig;
