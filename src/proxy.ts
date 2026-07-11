import { NextResponse, type NextRequest } from "next/server";

// CSP con nonce por peticion (patron oficial de Next.js App Router). El
// Router necesita inyectar <script> inline sin src (el payload RSC va
// literal en el HTML: self.__next_f.push(...)) para poder hidratar. Un
// script-src 'self' a secas bloquea esos scripts inline SIN lanzar ningun
// error de React visible: la app se queda en el primer render estatico
// para siempre (asi se detecto: Settings dejo de reaccionar a clicks y
// /api/status se quedaba en "Checking..." eternamente). La alternativa
// facil (anadir 'unsafe-inline') permitiria CUALQUIER script inline, que es
// justo lo que CSP existe para evitar; el nonce por peticion mantiene la
// proteccion real (un atacante no puede adivinar el nonce) y a la vez deja
// que el propio bootstrap de Next.js hidrate con normalidad.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

export const config = {
  matcher: [
    // Aplica a todo salvo assets estaticos ya cacheados/inmutables.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|apple-touch-icon\\.png|favicon-32\\.png).*)",
  ],
};
