import {
  type CouncilMode,
  type CouncilRole,
  resolveRolesForMode,
} from "@/config/councilRoles";
import { getProvider } from "@/lib/aiProviders";
import { generateDemoResponse } from "@/lib/demoContent";
import type { AgentResponse, OrchestratorResult } from "@/lib/types";

export interface RunCouncilInput {
  problem: string;
  mode: CouncilMode;
  manualRoleIds?: string[];
  useDemoMode?: boolean;
}

async function callSpecialist(
  role: CouncilRole,
  problem: string,
  round: number,
  useDemoMode: boolean,
  context?: string
): Promise<AgentResponse> {
  const userPrompt = context
    ? `Decision o problema planteado por el Presidente:\n${problem}\n\nInformes de otros especialistas en la ronda anterior:\n${context}\n\nResponde ahora reaccionando a los puntos de desacuerdo, manteniendo tu rol.`
    : `Decision o problema planteado por el Presidente:\n${problem}`;

  const base: Omit<AgentResponse, "response" | "error"> = {
    roleId: role.id,
    roleName: role.name,
    provider: role.provider,
    model: role.model,
    round,
    prompt: userPrompt,
  };

  // Modo demo: respuestas simuladas al instante, sin gastar en ninguna API.
  if (useDemoMode) {
    return { ...base, response: generateDemoResponse(role, problem) };
  }

  const provider = getProvider(role.provider);

  if (!provider.isConfigured()) {
    return {
      ...base,
      response: "",
      error: `El proveedor "${role.provider}" no esta configurado. Anade su API key en las variables de entorno.`,
    };
  }

  try {
    const result = await provider.generate({
      model: role.model,
      systemPrompt: role.basePrompt,
      userPrompt,
    });
    return { ...base, response: result.text };
  } catch (err) {
    return {
      ...base,
      response: "",
      error: err instanceof Error ? err.message : "Error desconocido al consultar al especialista.",
    };
  }
}

// Orquestador del Consejo: recibe el problema, el modo y (si aplica) los
// roles elegidos manualmente, convoca a los especialistas necesarios y
// devuelve sus respuestas estructuradas. No convoca siempre a todos los
// modelos: solo a los especialistas necesarios segun el modo (coste
// controlado).
export async function runCouncil({
  problem,
  mode,
  manualRoleIds,
  useDemoMode = false,
}: RunCouncilInput): Promise<OrchestratorResult> {
  const roles = resolveRolesForMode(mode, manualRoleIds);

  if (roles.length === 0) {
    throw new Error("No se ha seleccionado ningun especialista para esta consulta.");
  }

  const round1 = await Promise.all(
    roles.map((role) => callSpecialist(role, problem, 1, useDemoMode))
  );

  if (mode !== "debate") {
    return { problem, mode, roles: roles.map((r) => r.id), responses: round1 };
  }

  // Modo debate: segunda ronda donde cada especialista responde a los
  // desacuerdos vistos en la primera ronda.
  const contextForRound2 = round1
    .map((r) => `- ${r.roleName}: ${r.error ? `(error: ${r.error})` : r.response}`)
    .join("\n");

  const round2 = await Promise.all(
    roles.map((role) => callSpecialist(role, problem, 2, useDemoMode, contextForRound2))
  );

  return {
    problem,
    mode,
    roles: roles.map((r) => r.id),
    responses: [...round1, ...round2],
  };
}
