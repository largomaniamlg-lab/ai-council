import { getModeratorRole } from "@/config/councilRoles";
import { getProvider } from "@/lib/aiProviders";
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

function buildModeratorPrompt(problem: string, responses: AgentResponse[]): string {
  const reports = responses
    .map((r) => {
      const label = r.round > 1 ? `${r.roleName} (ronda ${r.round})` : r.roleName;
      return `### ${label}\n${r.error ? `No disponible: ${r.error}` : r.response}`;
    })
    .join("\n\n");

  return `Problema o decision planteado por el Presidente:\n${problem}\n\nInformes de los especialistas del Consejo:\n\n${reports}\n\n${JSON_INSTRUCTIONS}`;
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
  responses: AgentResponse[]
): Promise<{ minutes: CouncilMinutes; markdown: string }> {
  const moderator = getModeratorRole();
  const provider = getProvider(moderator.provider);

  let minutes: CouncilMinutes;

  if (!provider.isConfigured()) {
    minutes = {
      summary: "El Moderador no pudo generar el acta: falta configurar el proveedor de IA.",
      agreements: [],
      disagreements: [],
      risks: [],
      openQuestions: [],
      recommendation: "Configura la variable de entorno del proveedor y vuelve a intentarlo.",
    };
  } else {
    const userPrompt = buildModeratorPrompt(problem, responses);
    try {
      const result = await provider.generate({
        model: moderator.model,
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
