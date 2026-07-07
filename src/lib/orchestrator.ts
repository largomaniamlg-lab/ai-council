import {
  getRoleById,
  type CouncilMode,
  type CouncilRole,
  resolveRolesForMode,
} from "@/config/councilRoles";
import { getProvider } from "@/lib/aiProviders";
import { generateDemoChallengeResponse, generateDemoResponse, getDemoConfidence } from "@/lib/demoContent";
import { SIMULATOR_PROVIDER, SIMULATOR_MODEL } from "@/lib/simulatorEngine";
import { getLanguageInstruction } from "@/lib/promptLocale";
import {
  CONFIDENCE_INSTRUCTION,
  STANCE_INSTRUCTION,
  extractConfidence,
  extractStance,
} from "@/lib/confidenceParsing";
import type { Locale } from "@/lib/i18n";
import type { AgentResponse, CouncilMinutes, OrchestratorResult } from "@/lib/types";

// Numero maximo de rondas de deliberacion (Challenge the Council) por
// sesion, contando la ronda inicial. Limite deliberado para controlar
// tiempo/coste: el modo Debate ya consume 2 de estas 4 rondas el solo.
export const MAX_DELIBERATION_ROUNDS = 4;

export interface RunCouncilInput {
  problem: string;
  mode: CouncilMode;
  manualRoleIds?: string[];
  useDemoMode?: boolean;
  locale?: Locale;
}

// Un unico Council Engine para ambos modos: Council Simulator (useDemoMode)
// y Live Mode solo difieren en que proveedor/modelo se usa para generar
// cada respuesta. El flujo (prompt por rol, una llamada por especialista,
// misma forma de respuesta) es identico en los dos casos.
async function callSpecialist(
  role: CouncilRole,
  problem: string,
  round: number,
  useDemoMode: boolean,
  locale: Locale | undefined,
  context?: string
): Promise<AgentResponse> {
  const baseUserPrompt = context
    ? `Decision o problema planteado por el Presidente:\n${problem}\n\nInformes de otros especialistas en la ronda anterior:\n${context}\n\nResponde ahora reaccionando a los puntos de desacuerdo, manteniendo tu rol.`
    : `Decision o problema planteado por el Presidente:\n${problem}`;

  // La instruccion de idioma va al final: el contenido generado debe
  // seguir el idioma elegido en Settings, no el idioma en que esta escrito
  // el prompt base del rol. La de confianza va tras esa, como ultima linea.
  const userPrompt = `${baseUserPrompt}\n\n${getLanguageInstruction(locale)}\n\n${CONFIDENCE_INSTRUCTION}`;

  const providerId = useDemoMode ? SIMULATOR_PROVIDER : role.provider;
  const model = useDemoMode ? SIMULATOR_MODEL : role.model;

  const base: Omit<AgentResponse, "response" | "error" | "confidence" | "elapsedMs"> = {
    roleId: role.id,
    roleName: role.name,
    provider: providerId,
    model,
    round,
    prompt: userPrompt,
  };

  const provider = getProvider(providerId);
  const startedAt = Date.now();

  if (!provider.isConfigured()) {
    // Sin API key configurada todavia (ni siquiera la gratuita de
    // OpenRouter para el Council Simulator): recurrimos a una plantilla
    // local para que la demo no se rompa mientras el Presidente termina
    // el setup.
    if (useDemoMode) {
      return {
        ...base,
        response: generateDemoResponse(role, problem),
        confidence: getDemoConfidence(role),
        elapsedMs: Date.now() - startedAt,
      };
    }
    return {
      ...base,
      response: "",
      error: `El proveedor "${providerId}" no esta configurado. Anade su API key en las variables de entorno.`,
      elapsedMs: Date.now() - startedAt,
    };
  }

  try {
    const result = await provider.generate({
      model,
      systemPrompt: role.basePrompt,
      userPrompt,
    });
    const elapsedMs = Date.now() - startedAt;
    const { text, confidence } = extractConfidence(result.text);
    return { ...base, response: text, confidence, elapsedMs };
  } catch (err) {
    return {
      ...base,
      response: "",
      error: err instanceof Error ? err.message : "Error desconocido al consultar al especialista.",
      elapsedMs: Date.now() - startedAt,
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
  locale,
}: RunCouncilInput): Promise<OrchestratorResult> {
  const roles = resolveRolesForMode(mode, manualRoleIds);

  if (roles.length === 0) {
    throw new Error("No se ha seleccionado ningun especialista para esta consulta.");
  }

  const round1 = await Promise.all(
    roles.map((role) => callSpecialist(role, problem, 1, useDemoMode, locale))
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
    roles.map((role) => callSpecialist(role, problem, 2, useDemoMode, locale, contextForRound2))
  );

  return {
    problem,
    mode,
    roles: roles.map((r) => r.id),
    responses: [...round1, ...round2],
  };
}

// Ronda de deliberacion: el especialista reconsidera su ultimo informe a la
// luz del challenge del Presidente y del acta previa, y declara si mantiene
// o revisa su postura (STANCE).
async function callSpecialistChallenge(
  role: CouncilRole,
  problem: string,
  round: number,
  useDemoMode: boolean,
  locale: Locale | undefined,
  ownPriorResponse: AgentResponse | undefined,
  latestMinutes: CouncilMinutes,
  challenge: string
): Promise<AgentResponse> {
  const userPrompt = `Decision o problema planteado por el Presidente:\n${problem}\n\nTu informe anterior (ronda ${
    ownPriorResponse?.round ?? round - 1
  }):\n${ownPriorResponse?.response ?? "(sin informe previo)"}\n\nActa del Consejo tras esa ronda:\nResumen: ${
    latestMinutes.summary
  }\nRecomendacion: ${latestMinutes.recommendation}\n\nEl Presidente desafia al Consejo con lo siguiente:\n"${challenge}"\n\nReconsidera tu analisis a la luz de esto, manteniendo tu rol.\n\n${STANCE_INSTRUCTION}\n\n${getLanguageInstruction(
    locale
  )}\n\n${CONFIDENCE_INSTRUCTION}`;

  const providerId = useDemoMode ? SIMULATOR_PROVIDER : role.provider;
  const model = useDemoMode ? SIMULATOR_MODEL : role.model;

  const base: Omit<AgentResponse, "response" | "error" | "confidence" | "elapsedMs" | "stance"> = {
    roleId: role.id,
    roleName: role.name,
    provider: providerId,
    model,
    round,
    prompt: userPrompt,
  };

  const provider = getProvider(providerId);
  const startedAt = Date.now();

  if (!provider.isConfigured()) {
    if (useDemoMode) {
      return {
        ...base,
        response: generateDemoChallengeResponse(role, problem, challenge),
        confidence: getDemoConfidence(role),
        stance: "maintain",
        elapsedMs: Date.now() - startedAt,
      };
    }
    return {
      ...base,
      response: "",
      error: `El proveedor "${providerId}" no esta configurado. Anade su API key en las variables de entorno.`,
      elapsedMs: Date.now() - startedAt,
    };
  }

  try {
    const result = await provider.generate({
      model,
      systemPrompt: role.basePrompt,
      userPrompt,
    });
    const elapsedMs = Date.now() - startedAt;
    const { text: withoutConfidence, confidence } = extractConfidence(result.text);
    const { text, stance } = extractStance(withoutConfidence);
    return { ...base, response: text, confidence, stance, elapsedMs };
  } catch (err) {
    return {
      ...base,
      response: "",
      error: err instanceof Error ? err.message : "Error desconocido al consultar al especialista.",
      elapsedMs: Date.now() - startedAt,
    };
  }
}

export interface ContinueDeliberationInput {
  problem: string;
  roleIds: string[];
  history: AgentResponse[];
  latestMinutes: CouncilMinutes;
  challenge: string;
  nextRound: number;
  useDemoMode?: boolean;
  locale?: Locale;
}

// "Challenge the Council" (Modo A, re-deliberacion completa): vuelve a
// convocar a los mismos especialistas de la sesion para que reconsideren su
// ultimo informe frente al challenge del Presidente.
export async function continueDeliberation({
  problem,
  roleIds,
  history,
  latestMinutes,
  challenge,
  nextRound,
  useDemoMode = false,
  locale,
}: ContinueDeliberationInput): Promise<AgentResponse[]> {
  const roles = roleIds.map((id) => getRoleById(id)).filter((r): r is CouncilRole => Boolean(r));

  if (roles.length === 0) {
    throw new Error("No se ha encontrado ningun especialista de la sesion original.");
  }

  return Promise.all(
    roles.map((role) => {
      const ownPrior = [...history].reverse().find((r) => r.roleId === role.id);
      return callSpecialistChallenge(
        role,
        problem,
        nextRound,
        useDemoMode,
        locale,
        ownPrior,
        latestMinutes,
        challenge
      );
    })
  );
}
