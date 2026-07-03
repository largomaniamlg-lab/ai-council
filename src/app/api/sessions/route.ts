import { NextResponse } from "next/server";
import { listSessions } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "Falta projectId." }, { status: 400 });
  }

  const sessions = await listSessions(projectId);
  return NextResponse.json({ sessions });
}
