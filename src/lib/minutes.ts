import { getModeratorRole } from "@/config/councilRoles";
import { getProvider } from "@/lib/aiProviders";
import { generateDemoMinutes } from "@/lib/demoContent";
import { SIMULATOR_PROVIDER, SIMULATOR_MODEL } from "@/lib/simulatorEngine";
import { getLanguageInstruction } from "@/lib/promptLocale";
import type { Locale } from "@/lib/i18n";
import type { AgentResponse, CouncilMinutes } from "@/lib/types";

const JSON_INSTRUCTIONS = `
Responde UNICAMENTE con un objeto JSON valido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "summary": "string",
  "agreements": ["string"],
  "disagreements": ["string"],
  "risks": ["string"],
  "openQuestions": ["string"],
  "recommendation": "string"
}
`;

const JSON_INSTRUCTIONS_CHALLENGE = `
Responde UNICAMENTE con un objeto JSON valido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "summary": "string",
  "agreements": ["string"],
  "disagreements": ["string"],
  "risks": ["string"],
  "openQuestions": ["string"],
  "recommendation": "string",
  "verdict": "maintained" | "revised" | "mixed",
  "convergenceNote": "string"
}
Empieza el campo "summary" dejando claro, en una frase, si el Consejo mantiene su posicion anterior o la revisa.
"convergenceNote" debe explicar si el Consejo esta convergiendo hacia una conclusion estable o si el desacuerdo persiste.
`;

function buildModeratorPrompt(
  problem: string,
  responses: AgentResponse[],
  locale?: Locale
): string {
  const reports = responses
    .map((r) => {
      const label = r.round > 1 ? `${r.roleName} (ronda ${r.round})` : r.roleName;
      return `### ${label}\n${r.error ? `No disponible: ${r.error}` : r.response}`;
    })
    .join("\n\n");

  // Los nombres de los campos JSON deben mantenerse en ingles (summary,
  // agreements...); solo el contenido de los valores debe seguir el idioma
  // elegido en Settings.
  return `Problema o decision planteado por el Presidente:\n${problem}\n\nInformes de los especialistas del Consejo:\n\n${reports}\n\n${JSON_INSTRUCTIONS}\n\n${getLanguageInstruction(
    locale
  )} (Manten los nombres de los campos JSON en ingles; solo el contenido de los valores debe estar en ese idioma.)`;
}

function tryParseMinutes(raw: string, round: number): CouncilMinutes | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    const verdict =
      parsed.verdict === "maintained" || parsed.verdict === "revised" || parsed.verdict === "mixed"
        ? parsed.verdict
        : undefined;
    return {
      round,
      summary: String(parsed.summary ?? ""),
      agreements: Array.isArray(parsed.agreements) ? parsed.agreements.map(String) : [],
      disagreements: Array.isArray(parsed.disagreements) ? parsed.disagreements.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.map(String) : [],
      recommendation: String(parsed.recommendation ?? ""),
      verdict,
      convergenceNote: parsed.convergenceNote ? String(parsed.convergenceNote) : undefined,
    };
  } catch {
    return null;
  }
}

// Recibe las respuestas de los especialistas y devuelve el acta final del
// Consejo, tanto en forma estructurada (JSON) como en texto legible en
// Markdown para copiar/exportar.
export async function generateCouncilMinutes(
  problem: string,
  responses: AgentResponse[],
  useDemoMode = false,
  locale?: Locale
): Promise<{ minutes: CouncilMinutes; markdown: string }> {
  const moderator = getModeratorRole();

  let minutes: CouncilMinutes;

  const providerId = useDemoMode ? SIMULATOR_PROVIDER : moderator.provider;
  const model = useDemoMode ? SIMULATOR_MODEL : moderator.model;
  const provider = getProvider(providerId);

  if (!provider.isConfigured()) {
    // Sin API key configurada todavia: si es el Council Simulator, cae en
    // una plantilla local para no romper la demo mientras se termina el
    // setup; en Live Mode se informa del proveedor que falta configurar.
    if (useDemoMode) {
      minutes = { ...generateDemoMinutes(problem), round: 1 };
      return { minutes, markdown: minutesToMarkdown(problem, minutes) };
    }
    minutes = {
      round: 1,
      summary: `El Moderador no pudo generar el acta: el proveedor "${providerId}" no esta configurado.`,
      agreements: [],
      disagreements: [],
      risks: [],
      openQuestions: [],
      recommendation: "Configura la variable de entorno del proveedor y vuelve a intentarlo.",
    };
  } else {
    const userPrompt = buildModeratorPrompt(problem, responses, locale);
    try {
      const result = await provider.generate({
        model,
        systemPrompt: moderator.basePrompt,
        userPrompt,
      });
      minutes =
        tryParseMinutes(result.text, 1) ?? {
          round: 1,
          summary: result.text,
          agreements: [],
          disagreements: [],
          risks: [],
          openQuestions: [],
          recommendation: "",
        };
    } catch (err) {
      minutes = {
        round: 1,
        summary: `No se pudo generar el acta: ${
          err instanceof Error ? err.message : "error desconocido"
        }`,
        agreements: [],
        disagreements: [],
        risks: [],
        openQuestions: [],
        recommendation: "",
      };
    }
  }

  return { minutes, markdown: minutesToMarkdown(problem, minutes) };
}

export function minutesToMarkdown(problem: string, minutes: CouncilMinutes): string {
  const section = (title: string, items: string[]) =>
    items.length ? `## ${title}\n${items.map((i) => `- ${i}`).join("\n")}\n` : `## ${title}\n_Ninguno_\n`;

  return [
    `# Acta del Consejo de IA${minutes.round > 1 ? ` - Ronda ${minutes.round}` : ""}`,
    `**Problema o decision:** ${problem}`,
    ``,
    `## Resumen`,
    minutes.summary || "_Sin resumen_",
    ``,
    section("Acuerdos", minutes.agreements),
    section("Desacuerdos", minutes.disagreements),
    section("Riesgos", minutes.risks),
    section("Preguntas abiertas", minutes.openQuestions),
    `## Recomendacion`,
    minutes.recommendation || "_Sin recomendacion_",
    ...(minutes.convergenceNote ? [``, `## Convergencia`, minutes.convergenceNote] : []),
  ].join("\n");
}

function deriveVerdictFromStances(responses: AgentResponse[]): "maintained" | "revised" | "mixed" {
  const stances = responses.map((r) => r.stance).filter((s): s is "maintain" | "revise" => Boolean(s));
  if (stances.length === 0) return "maintained";
  const revised = stances.some((s) => s === "revise");
  const maintained = stances.some((s) => s === "maintain");
  if (revised && maintained) return "mixed";
  return revised ? "revised" : "maintained";
}

function buildChallengeModeratorPrompt(
  problem: string,
  roundResponses: AgentResponse[],
  latestMinutes: CouncilMinutes,
  challenge: string,
  round: number,
  isModeratorOnly: boolean,
  locale?: Locale
): string {
  const reports = isModeratorOnly
    ? "(No se ha convocado a ningun especialista para esta ronda: responde tu directamente como Moderador con el contexto ya disponible.)"
    : roundResponses
        .map((r) => {
          const stanceLabel = r.stance ? ` [${r.stance === "revise" ? "REVISA" : "MANTIENE"}]` : "";
          return `### ${r.roleName}${stanceLabel}\n${r.error ? `No disponible: ${r.error}` : r.response}`;
        })
        .join("\n\n");

  return `Problema o decision planteado por el Presidente:\n${problem}\n\nActa del Consejo de la ronda anterior:\nResumen: ${
    latestMinutes.summary
  }\nRecomendacion: ${
    latestMinutes.recommendation
  }\n\nEl Presidente desafia al Consejo (ronda ${round}) con lo siguiente:\n"${challenge}"\n\nInformes de los especialistas en esta ronda:\n\n${reports}\n\n${JSON_INSTRUCTIONS_CHALLENGE}\n\n${getLanguageInstruction(
    locale
  )} (Manten los nombres de los campos JSON en ingles; solo el contenido de los valores debe estar en ese idioma.)`;
}

export interface ChallengeMinutesInput {
  problem: string;
  roundResponses: AgentResponse[];
  latestMinutes: CouncilMinutes;
  challenge: string;
  round: number;
  isModeratorOnly: boolean;
  useDemoMode?: boolean;
  locale?: Locale;
}

// Genera el acta de una ronda de deliberacion (tras un "Challenge the
// Council"), tanto en modo A (re-deliberacion completa) como en modo B
// (quick follow-up solo al Moderador, sin convocar especialistas).
export async function generateChallengeMinutes({
  problem,
  roundResponses,
  latestMinutes,
  challenge,
  round,
  isModeratorOnly,
  useDemoMode = false,
  locale,
}: ChallengeMinutesInput): Promise<{ minutes: CouncilMinutes; markdown: string }> {
  const moderator = getModeratorRole();
  const fallbackVerdict = isModeratorOnly ? undefined : deriveVerdictFromStances(roundResponses);

  let minutes: CouncilMinutes;

  const providerId = useDemoMode ? SIMULATOR_PROVIDER : moderator.provider;
  const model = useDemoMode ? SIMULATOR_MODEL : moderator.model;
  const provider = getProvider(providerId);

  if (!provider.isConfigured()) {
    if (useDemoMode) {
      minutes = {
        ...generateDemoMinutes(problem),
        round,
        isModeratorOnly,
        verdict: fallbackVerdict,
        convergenceNote: isModeratorOnly
          ? undefined
          : "[Respuesta simulada - modo demo] En modo demo el Consejo no reconsidera de verdad; activa Live Mode para una deliberacion real.",
      };
      return { minutes, markdown: minutesToMarkdown(problem, minutes) };
    }
    minutes = {
      round,
      isModeratorOnly,
      summary: `El Moderador no pudo generar el acta: el proveedor "${providerId}" no esta configurado.`,
      agreements: [],
      disagreements: [],
      risks: [],
      openQuestions: [],
      recommendation: "Configura la variable de entorno del proveedor y vuelve a intentarlo.",
    };
  } else {
    const userPrompt = buildChallengeModeratorPrompt(
      problem,
      roundResponses,
      latestMinutes,
      challenge,
      round,
      isModeratorOnly,
      locale
    );
    try {
      const result = await provider.generate({
        model,
        systemPrompt: moderator.basePrompt,
        userPrompt,
      });
      const parsed = tryParseMinutes(result.text, round);
      minutes = parsed
        ? { ...parsed, isModeratorOnly, verdict: parsed.verdict ?? fallbackVerdict }
        : {
            round,
            isModeratorOnly,
            summary: result.text,
            agreements: [],
            disagreements: [],
            risks: [],
            openQuestions: [],
            recommendation: "",
            verdict: fallbackVerdict,
          };
    } catch (err) {
      minutes = {
        round,
        isModeratorOnly,
        summary: `No se pudo generar el acta: ${
          err instanceof Error ? err.message : "error desconocido"
        }`,
        agreements: [],
        disagreements: [],
        risks: [],
        openQuestions: [],
        recommendation: "",
      };
    }
  }

  return { minutes, markdown: minutesToMarkdown(problem, minutes) };
}
