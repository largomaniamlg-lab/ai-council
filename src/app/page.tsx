import AppShell from "@/components/AppShell";
import { listProjects, isSupabaseConfigured } from "@/lib/data";

export default async function Home() {
  const supabaseConfigured = isSupabaseConfigured();
  const projects = await listProjects();

  return <AppShell initialProjects={projects} supabaseConfigured={supabaseConfigured} />;
}
