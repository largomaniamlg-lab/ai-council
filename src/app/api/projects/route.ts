import { NextResponse } from "next/server";
import { listProjects, createProject, isSupabaseConfigured } from "@/lib/data";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects, supabaseConfigured: isSupabaseConfigured() });
}

export async function POST(request: Request) {
  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido en la peticion." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "El proyecto necesita un nombre." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no esta configurado, no se pueden guardar proyectos." },
      { status: 503 }
    );
  }

  const project = await createProject(body.name.trim(), body.description);
  return NextResponse.json({ project });
}
