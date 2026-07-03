import { NextResponse } from "next/server";
import { saveDecision, isSupabaseConfigured } from "@/lib/data";

interface RequestBody {
  sessionId: string;
  finalDecision: string;
  rationale?: string;
  expectedResult?: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { sessionId, finalDecision, rationale, expectedResult } = body;

  if (!sessionId || !finalDecision?.trim()) {
    return NextResponse.json({ error: "Falta la sesion o la decision final." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado, no se puede guardar la decision." },
      { status: 503 }
    );
  }

  await saveDecision(sessionId, {
    finalDecision,
    rationale: rationale ?? "",
    expectedResult: expectedResult ?? "",
  });

  return NextResponse.json({ ok: true });
}
