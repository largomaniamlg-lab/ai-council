import { NextResponse } from "next/server";
import { listAllSessionsSummary, isSupabaseConfigured } from "@/lib/data";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sessions: [] });
  }
  const sessions = await listAllSessionsSummary();
  return NextResponse.json({ sessions });
}
