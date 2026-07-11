import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Limite distribuido por IP para proteger la cuota gratuita de OpenRouter
// frente a abuso anonimo. Usa Upstash Redis (REST, compatible con
// serverless/Vercel) en vez de un contador en memoria: cada instancia de
// Vercel tendria su propio contador con memoria local, lo que no protege
// nada de verdad contra alguien decidido a abusar.
//
// Mock AI (mockAI: true) nunca consume cuota ni pasa por aqui.

const isDev = process.env.NODE_ENV !== "production";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isRateLimitConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

const redis = getRedis();

// 1 peticion real cada 20 segundos por IP.
const cooldownLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "20 s"), prefix: "ac:cooldown" })
  : null;

// 10 llamadas logicas de IA por IP al dia (una por peticion HTTP a
// Discovery/session/minutes/challenge, no por especialista individual).
const dailyCallsLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 d"), prefix: "ac:dailycalls" })
  : null;

// 3 sesiones reales (consultas nuevas) por IP al dia.
const dailySessionsLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "1 d"), prefix: "ac:dailysessions" })
  : null;

export function getClientIp(request: Request): string {
  // Vercel siempre reenvia la IP real del visitante en x-forwarded-for (la
  // primera de la lista); en local/dev esa cabecera no existe.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "local-dev";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

async function check(limiter: Ratelimit | null, key: string): Promise<RateLimitResult> {
  if (!limiter) {
    // Sin Upstash configurado: en dev dejamos pasar (con aviso en logs)
    // para no bloquear el desarrollo local; en produccion NUNCA dejamos
    // pasar una peticion real sin proteccion silenciosamente - es
    // preferible que el Presidente vea un error claro a que la cuota
    // quede expuesta sin limite.
    if (isDev) {
      console.warn(
        `[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN no configurados: permitiendo "${key}" sin limite (solo en desarrollo).`
      );
      return { allowed: true };
    }
    return { allowed: false, retryAfterSeconds: 60 };
  }

  const result = await limiter.limit(key);
  if (result.success) return { allowed: true };

  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { allowed: false, retryAfterSeconds };
}

// Comprueba el cooldown de 20s Y el tope diario de llamadas logicas para
// una IP. Se llama una vez por cada peticion real (mockAI=false) a
// Discovery, session, minutes o challenge.
export async function checkAiCallLimit(ip: string): Promise<RateLimitResult> {
  const cooldown = await check(cooldownLimiter, ip);
  if (!cooldown.allowed) return cooldown;

  const dailyCalls = await check(dailyCallsLimiter, ip);
  if (!dailyCalls.allowed) return dailyCalls;

  return { allowed: true };
}

// Tope diario de sesiones NUEVAS (consultas iniciales) por IP. Se llama
// solo desde /api/council/session.
export async function checkNewSessionLimit(ip: string): Promise<RateLimitResult> {
  return check(dailySessionsLimiter, ip);
}
