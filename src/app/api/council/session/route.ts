import { NextResponse } from "next/server";
import { runCouncil } from "@/lib/orchestrator";
import { createSession, saveAgentResponses, isSupabaseConfigured } from "@/lib/data";
import { isValidText, MAX_TEXT_LENGTH } from "@/lib/validation";
import type { CouncilMode } from "@/config/councilRoles";
import type { Locale } from "@/lib/i18n";
import type { DiscoveryQA } from "@/lib/types";

// El problema que llega aqui puede venir enriquecido con el historial de
// Discovery (varias preguntas y respuestas concatenadas), por lo que se
// admite un limite mayor que el de un unico campo de texto libre.
const MAX_ENRICHED_PROBLEM_LENGTH = MAX_TEXT_LENGTH * 3;

// El Council Simulator (modelo gratuito) puede tardar 15-90s por
// especialista. El limite por defecto de Vercel (Hobby, Fluid Compute) es
// de 300s, mas que suficiente; lo dejamos explicito con margen.
export const maxDuration = 120;

interface RequestBody {
  projectId?: string;
  title?: string;
  problem: string;
  mode: CouncilMode;
  manualRoleIds?: string[];
  useDemoMode?: boolean;
  locale?: Locale;
  discoveryHistory?: DiscoveryQA[];
  mockAI?: boolean;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { projectId, title, problem, mode, manualRoleIds, useDemoMode, locale, discoveryHistory, mockAI } =
    body;

  if (!problem || !problem.trim()) {
    return NextResponse.json({ error: "El problema o decision no puede estar vacio." }, { status: 400 });
  }
  if (!isValidText(problem, MAX_ENRICHED_PROBLEM_LENGTH)) {
    return NextResponse.json({ error: "El problema o decision es demasiado largo." }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "Falta el modo del Consejo (mode)." }, { status: 400 });
  }

  const result = await runCouncil({ problem, mode, manualRoleIds, useDemoMode, locale, mockAI });

  let sessionId: string | null = null;
  if (projectId && isSupabaseConfigured()) {
    try {
      const session = await createSession({
        projectId,
        title: title?.trim() || problem.slice(0, 80),
        problem,
        mode,
        locale,
        discoveryHistory,
        source: mockAI ? "mock" : "real",
      });
      if (session) {
        sessionId = session.id;
        await saveAgentResponses(session.id, result.responses);
      }
    } catch (err) {
      // No bloqueamos la respuesta al Presidente por un fallo de persistencia.
      console.error("Error guardando la sesion en Supabase:", err);
    }
  }

  return NextResponse.json({
    sessionId,
    persisted: Boolean(sessionId),
    ...result,
  });
}
