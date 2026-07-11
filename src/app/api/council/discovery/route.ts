import { NextResponse } from "next/server";
import { assessDiscovery } from "@/lib/discovery";
import { isValidText } from "@/lib/validation";
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
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { problem, history, round, useDemoMode, locale } = body;

  if (!problem || !problem.trim()) {
    return NextResponse.json({ error: "El problema o decision no puede estar vacio." }, { status: 400 });
  }
  if (!isValidText(problem)) {
    return NextResponse.json({ error: "El problema o decision es demasiado largo." }, { status: 400 });
  }
  if ((history ?? []).some((h) => !isValidText(h.answer))) {
    return NextResponse.json({ error: "Una de las respuestas de Discovery es demasiado larga." }, { status: 400 });
  }

  const assessment = await assessDiscovery({
    problem,
    history: history ?? [],
    round: round ?? 1,
    useDemoMode,
    locale,
  });

  return NextResponse.json({ assessment });
}
