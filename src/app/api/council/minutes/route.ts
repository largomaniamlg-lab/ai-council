import { NextResponse } from "next/server";
import { generateCouncilMinutes } from "@/lib/minutes";
import { saveMinutesRound, isSupabaseConfigured } from "@/lib/data";
import { isValidText, MAX_TEXT_LENGTH } from "@/lib/validation";
import type { AgentResponse } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

// Ver nota en app/api/council/session/route.ts sobre el limite de Vercel.
export const maxDuration = 120;

// El problema puede llegar enriquecido con el historial de Discovery. Ver
// nota identica en app/api/council/session/route.ts.
const MAX_ENRICHED_PROBLEM_LENGTH = MAX_TEXT_LENGTH * 3;

interface RequestBody {
  sessionId?: string | null;
  problem: string;
  responses: AgentResponse[];
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

  const { sessionId, problem, responses, useDemoMode, locale } = body;

  if (!problem || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: "Se necesita el problema y al menos una respuesta de especialista." },
      { status: 400 }
    );
  }
  if (!isValidText(problem, MAX_ENRICHED_PROBLEM_LENGTH)) {
    return NextResponse.json({ error: "El problema o decision es demasiado largo." }, { status: 400 });
  }

  const { minutes, markdown } = await generateCouncilMinutes(
    problem,
    responses,
    useDemoMode,
    locale
  );

  if (sessionId && isSupabaseConfigured()) {
    try {
      await saveMinutesRound(sessionId, minutes, markdown);
    } catch (err) {
      console.error("Error guardando el acta en Supabase:", err);
    }
  }

  return NextResponse.json({ minutes, markdown });
}
