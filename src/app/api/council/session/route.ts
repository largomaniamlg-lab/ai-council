import { NextResponse } from "next/server";
import { runCouncil } from "@/lib/orchestrator";
import { createSession, saveAgentResponses, isSupabaseConfigured } from "@/lib/data";
import type { CouncilMode } from "@/config/councilRoles";

interface RequestBody {
  projectId?: string;
  title?: string;
  problem: string;
  mode: CouncilMode;
  manualRoleIds?: string[];
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { projectId, title, problem, mode, manualRoleIds } = body;

  if (!problem || !problem.trim()) {
    return NextResponse.json({ error: "El problema o decision no puede estar vacio." }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "Falta el modo del Consejo (mode)." }, { status: 400 });
  }

  const result = await runCouncil({ problem, mode, manualRoleIds });

  let sessionId: string | null = null;
  if (projectId && isSupabaseConfigured()) {
    try {
      const session = await createSession({
        projectId,
        title: title?.trim() || problem.slice(0, 80),
        problem,
        mode,
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
