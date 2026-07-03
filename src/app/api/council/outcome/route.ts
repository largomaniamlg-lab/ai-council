import { NextResponse } from "next/server";
import { saveOutcome, isSupabaseConfigured } from "@/lib/data";

interface RequestBody {
  sessionId: string;
  actualResult?: string;
  whatWorked?: string;
  whatFailed?: string;
  lessons?: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  const { sessionId, actualResult, whatWorked, whatFailed, lessons } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "Falta la sesion." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado, no se puede guardar el resultado." },
      { status: 503 }
    );
  }

  await saveOutcome(sessionId, {
    actualResult: actualResult ?? "",
    whatWorked: whatWorked ?? "",
    whatFailed: whatFailed ?? "",
    lessons: lessons ?? "",
  });

  return NextResponse.json({ ok: true });
}
