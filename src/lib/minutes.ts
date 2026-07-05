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

function tryParseMinutes(raw: string): CouncilMinutes | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    return {
      summary: String(parsed.summary ?? ""),
      agreements: Array.isArray(parsed.agreements) ? parsed.agreements.map(String) : [],
      disagreements: Array.isArray(parsed.disagreements) ? parsed.disagreements.map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions.map(String) : [],
      recommendation: String(parsed.recommendation ?? ""),
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
      minutes = generateDemoMinutes(problem);
      return { minutes, markdown: minutesToMarkdown(problem, minutes) };
    }
    minutes = {
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
        tryParseMinutes(result.text) ?? {
          summary: result.text,
          agreements: [],
          disagreements: [],
          risks: [],
          openQuestions: [],
          recommendation: "",
        };
    } catch (err) {
      minutes = {
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
    `# Acta del Consejo de IA`,
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
  ].join("\n");
}
