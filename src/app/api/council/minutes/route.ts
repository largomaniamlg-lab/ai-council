import { NextResponse } from "next/server";
import { generateCouncilMinutes } from "@/lib/minutes";
import { saveMinutes, isSupabaseConfigured } from "@/lib/data";
import type { AgentResponse } from "@/lib/types";

interface RequestBody {
  sessionId?: string | null;
  problem: string;
  responses: AgentResponse[];
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { sessionId, problem, responses } = body;

  if (!problem || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: "Se necesita el problema y al menos una respuesta de especialista." },
      { status: 400 }
    );
  }

  const { minutes, markdown } = await generateCouncilMinutes(problem, responses);

  if (sessionId && isSupabaseConfigured()) {
    try {
      await saveMinutes(sessionId, minutes, markdown);
    } catch (err) {
      console.error("Error guardando el acta en Supabase:", err);
    }
  }

  return NextResponse.json({ minutes, markdown });
}
