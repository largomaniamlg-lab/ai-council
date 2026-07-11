import { NextResponse } from "next/server";
import { assessDiscovery } from "@/lib/discovery";
import { isValidText } from "@/lib/validation";
import { checkAiCallLimit, getClientIp } from "@/lib/rateLimit";
import { tooManyAiCallsResponse } from "@/lib/rateLimitResponse";
import type { DiscoveryQA } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

// Ver nota en app/api/council/session/route.ts sobre el limite de Vercel.
export const maxDuration = 60;

interface RequestBody {
  problem: string;
  history?: DiscoveryQA[];
  round?: number;
  useDemoMode?: boolean;
  locale?: Locale;
  mockAI?: boolean;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { problem, history, round, useDemoMode, locale, mockAI } = body;

  if (!problem || !problem.trim()) {
    return NextResponse.json({ error: "El problema o decision no puede estar vacio." }, { status: 400 });
  }
  if (!isValidText(problem)) {
    return NextResponse.json({ error: "El problema o decision es demasiado largo." }, { status: 400 });
  }
  if ((history ?? []).some((h) => !isValidText(h.answer))) {
    return NextResponse.json({ error: "Una de las respuestas de Discovery es demasiado larga." }, { status: 400 });
  }

  if (!mockAI) {
    const callLimit = await checkAiCallLimit(getClientIp(request));
    if (!callLimit.allowed) return tooManyAiCallsResponse(callLimit, locale);
  }

  const assessment = await assessDiscovery({
    problem,
    history: history ?? [],
    round: round ?? 1,
    useDemoMode,
    locale,
    mockAI,
  });

  return NextResponse.json({ assessment });
}
