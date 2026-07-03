import { NextResponse } from "next/server";
import { getSessionDetail } from "@/lib/data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const detail = await getSessionDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "Sesion no encontrada." }, { status: 404 });
  }

  return NextResponse.json(detail);
}
