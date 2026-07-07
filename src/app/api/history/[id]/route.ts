import { NextResponse } from "next/server";
import { deleteSession, isSupabaseConfigured } from "@/lib/data";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado." }, { status: 400 });
  }
  const { id } = await params;
  await deleteSession(id);
  return NextResponse.json({ ok: true });
}
