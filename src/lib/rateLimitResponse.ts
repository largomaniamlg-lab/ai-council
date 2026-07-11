import { NextResponse } from "next/server";
import { dictionaries, type Locale } from "@/lib/i18n";
import type { RateLimitResult } from "@/lib/rateLimit";

// Construye una respuesta 429 con Retry-After y un mensaje traducido, para
// las tres variantes de limite (llamada de IA, sesion nueva, challenge por
// sesion).
function localizedError(locale: Locale | undefined, pick: (dict: (typeof dictionaries)[Locale]) => string) {
  const dict = dictionaries[locale ?? "en"] ?? dictionaries.en;
  return pick(dict);
}

export function tooManyAiCallsResponse(result: RateLimitResult, locale?: Locale) {
  return NextResponse.json(
    { error: localizedError(locale, (d) => d.errors.rateLimited) },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds ?? 60) } }
  );
}

export function tooManyNewSessionsResponse(result: RateLimitResult, locale?: Locale) {
  return NextResponse.json(
    { error: localizedError(locale, (d) => d.errors.rateLimitedNewSession) },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds ?? 3600) } }
  );
}

export function challengeLimitResponse(locale?: Locale) {
  return NextResponse.json(
    { error: localizedError(locale, (d) => d.errors.challengeLimitReached) },
    { status: 429 }
  );
}
