import { isSupabaseConfigured, getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AgentResponse,
  CouncilMinutes,
  PresidentDecision,
  SessionOutcome,
} from "@/lib/types";
import { getRoleById, type CouncilMode } from "@/config/councilRoles";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  project_id: string;
  title: string;
  problem: string;
  mode: CouncilMode;
  created_at: string;
}

export interface SessionDetail {
  session: Session;
  responses: AgentResponse[];
  minutes: (CouncilMinutes & { markdown: string }) | null;
  decision: PresidentDecision | null;
  outcome: SessionOutcome | null;
}

export { isSupabaseConfigured };

export async function listProjects(): Promise<Project[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProject(name: string, description?: string): Promise<Project | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, description: description ?? null })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function listSessions(projectId: string): Promise<Session[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSession(input: {
  projectId: string;
  title: string;
  problem: string;
  mode: CouncilMode;
}): Promise<Session | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      project_id: input.projectId,
      title: input.title,
      problem: input.problem,
      mode: input.mode,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveAgentResponses(
  sessionId: string,
  responses: AgentResponse[]
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const rows = responses.map((r) => ({
    session_id: sessionId,
    role: r.roleId,
    model_provider: r.provider,
    model_name: r.model,
    round: r.round,
    prompt: r.prompt,
    response: r.response,
    error: r.error ?? null,
  }));

  const { error } = await supabase.from("agent_responses").insert(rows);
  if (error) throw new Error(error.message);
}

export async function saveMinutes(
  sessionId: string,
  minutes: CouncilMinutes,
  markdown: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("council_minutes").insert({
    session_id: sessionId,
    summary: minutes.summary,
    agreements: minutes.agreements,
    disagreements: minutes.disagreements,
    risks: minutes.risks,
    open_questions: minutes.openQuestions,
    recommendation: minutes.recommendation,
    markdown,
  });

  if (error) throw new Error(error.message);
}

export async function saveDecision(
  sessionId: string,
  decision: PresidentDecision
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("president_decisions").insert({
    session_id: sessionId,
    final_decision: decision.finalDecision,
    rationale: decision.rationale,
    expected_result: decision.expectedResult,
  });

  if (error) throw new Error(error.message);
}

export async function saveOutcome(sessionId: string, outcome: SessionOutcome): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.from("outcomes").insert({
    session_id: sessionId,
    actual_result: outcome.actualResult,
    what_worked: outcome.whatWorked,
    what_failed: outcome.whatFailed,
    lessons: outcome.lessons,
  });

  if (error) throw new Error(error.message);
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: session, error: sessionError }, { data: responses }, { data: minutesRows }, { data: decisionRows }, { data: outcomeRows }] =
    await Promise.all([
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
      supabase.from("agent_responses").select("*").eq("session_id", sessionId).order("round"),
      supabase.from("council_minutes").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
      supabase.from("president_decisions").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
      supabase.from("outcomes").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
    ]);

  if (sessionError || !session) return null;

  const minutesRow = minutesRows?.[0];
  const decisionRow = decisionRows?.[0];
  const outcomeRow = outcomeRows?.[0];

  return {
    session,
    responses: (responses ?? []).map((r) => ({
      roleId: r.role,
      roleName: getRoleById(r.role)?.name ?? r.role,
      provider: r.model_provider,
      model: r.model_name,
      round: r.round,
      prompt: r.prompt,
      response: r.response ?? "",
      error: r.error ?? undefined,
    })),
    minutes: minutesRow
      ? {
          summary: minutesRow.summary,
          agreements: minutesRow.agreements ?? [],
          disagreements: minutesRow.disagreements ?? [],
          risks: minutesRow.risks ?? [],
          openQuestions: minutesRow.open_questions ?? [],
          recommendation: minutesRow.recommendation,
          markdown: minutesRow.markdown,
        }
      : null,
    decision: decisionRow
      ? {
          finalDecision: decisionRow.final_decision,
          rationale: decisionRow.rationale,
          expectedResult: decisionRow.expected_result,
        }
      : null,
    outcome: outcomeRow
      ? {
          actualResult: outcomeRow.actual_result,
          whatWorked: outcomeRow.what_worked,
          whatFailed: outcomeRow.what_failed,
          lessons: outcomeRow.lessons,
        }
      : null,
  };
}
