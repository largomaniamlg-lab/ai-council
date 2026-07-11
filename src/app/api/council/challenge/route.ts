import { NextResponse } from "next/server";
import { continueDeliberation, MAX_DELIBERATION_ROUNDS } from "@/lib/orchestrator";
import { generateChallengeMinutes } from "@/lib/minutes";
import { saveAgentResponses, saveMinutesRound, isSupabaseConfigured } from "@/lib/data";
import { isValidText } from "@/lib/validation";
import type { AgentResponse, CouncilMinutes } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

// Ver nota en app/api/council/session/route.ts sobre el limite de Vercel.
export const maxDuration = 120;

interface RequestBody {
  sessionId?: string | null;
  problem: string;
  roleIds: string[];
  history: AgentResponse[];
  latestMinutes: CouncilMinutes;
  challenge: string;
  challengeMode: "full" | "moderator";
  nextRound: number;
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

  const {
    sessionId,
    problem,
    roleIds,
    history,
    latestMinutes,
    challenge,
    challengeMode,
    nextRound,
    useDemoMode,
    locale,
    mockAI,
  } = body;

  if (!problem || !problem.trim()) {
    return NextResponse.json({ error: "El problema o decision no puede estar vacio." }, { status: 400 });
  }
  if (!isValidText(problem)) {
    return NextResponse.json({ error: "El problema o decision es demasiado largo." }, { status: 400 });
  }
  if (!challenge || !challenge.trim()) {
    return NextResponse.json({ error: "El challenge no puede estar vacio." }, { status: 400 });
  }
  if (!isValidText(challenge)) {
    return NextResponse.json({ error: "El challenge es demasiado largo." }, { status: 400 });
  }
  if (!latestMinutes) {
    return NextResponse.json({ error: "Falta el acta previa (latestMinutes)." }, { status: 400 });
  }
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    return NextResponse.json({ error: "Falta la lista de especialistas de la sesion (roleIds)." }, { status: 400 });
  }

  if (challengeMode === "full") {
    if (nextRound > MAX_DELIBERATION_ROUNDS) {
      return NextResponse.json(
        {
          error: `Se ha alcanzado el numero maximo de rondas de deliberacion (${MAX_DELIBERATION_ROUNDS}).`,
        },
        { status: 400 }
      );
    }

    const responses = await continueDeliberation({
      problem,
      roleIds,
      history: history ?? [],
      latestMinutes,
      challenge,
      nextRound,
      useDemoMode,
      locale,
      mockAI,
    });

    const { minutes, markdown } = await generateChallengeMinutes({
      problem,
      roundResponses: responses,
      latestMinutes,
      challenge,
      round: nextRound,
      isModeratorOnly: false,
      useDemoMode,
      locale,
      mockAI,
    });

    if (sessionId && isSupabaseConfigured()) {
      try {
        await saveAgentResponses(sessionId, responses);
        await saveMinutesRound(sessionId, minutes, markdown);
      } catch (err) {
        console.error("Error guardando la ronda de deliberacion en Supabase:", err);
      }
    }

    return NextResponse.json({ responses, minutes, markdown });
  }

  // Modo B: quick follow-up solo al Moderador, sin convocar especialistas.
  const { minutes, markdown } = await generateChallengeMinutes({
    problem,
    roundResponses: (history ?? []).filter((r) => r.round === latestMinutes.round),
    latestMinutes,
    challenge,
    round: latestMinutes.round,
    isModeratorOnly: true,
    useDemoMode,
    locale,
    mockAI,
  });

  if (sessionId && isSupabaseConfigured()) {
    try {
      await saveMinutesRound(sessionId, minutes, markdown);
    } catch (err) {
      console.error("Error guardando el follow-up del Moderador en Supabase:", err);
    }
  }

  return NextResponse.json({ responses: [], minutes, markdown });
}
