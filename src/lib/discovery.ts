import { getModeratorRole } from "@/config/councilRoles";
import { getProvider } from "@/lib/aiProviders";
import { generateDemoDiscovery } from "@/lib/demoContent";
import { SIMULATOR_PROVIDER, SIMULATOR_MODEL } from "@/lib/simulatorEngine";
import { getLanguageInstruction } from "@/lib/promptLocale";
import { friendlyProviderErrorMessage } from "@/lib/providerErrors";
import type { Locale } from "@/lib/i18n";
import type { DiscoveryAssessment, DiscoveryQA } from "@/lib/types";

// Numero maximo de rondas de Discovery antes de que el Consejo delibere
// igualmente con lo que tenga. Evita que el Presidente quede atrapado en un
// bucle de preguntas indefinido. Bajado de 3 a 2 para reducir el consumo de
// llamadas al modelo gratuito (cada ronda de Discovery es una llamada mas
// antes incluso de convocar a los especialistas).
export const MAX_DISCOVERY_ROUNDS = 2;

const JSON_INSTRUCTIONS_DISCOVERY = `
Responde UNICAMENTE con un objeto JSON valido (sin texto adicional, sin markdown) con esta forma exacta:
{
  "sufficient": true | false,
  "reason": "string",
  "missingInformation": ["string"],
  "questions": ["string"],
  "completeness": number
}
Si "sufficient" es true, deja "questions" y "missingInformation" como arrays vacios.
Si es false, incluye entre 3 y 7 preguntas concretas, accionables y especificas en "questions" (nunca preguntas genericas o vagas).
"completeness" es tu propia estimacion (0 a 100) de que porcentaje de la informacion necesaria para deliberar con fiabilidad ya tienes.
`;

function buildDiscoveryPrompt(problem: string, history: DiscoveryQA[], locale?: Locale): string {
  const context = history.length
    ? history
        .map(
          (h, i) =>
            `Ronda de Discovery ${i + 1}:\nPreguntas del Consejo: ${h.questions.join(" | ")}\nRespuesta del Presidente: ${h.answer}`
        )
        .join("\n\n")
    : "(Todavia no se ha preguntado nada al Presidente.)";

  return `Eres el Moderador del Consejo, en la fase de Discovery (antes de convocar a los especialistas).\n\nProblema o decision planteado por el Presidente:\n${problem}\n\nHistorial de Discovery hasta ahora:\n${context}\n\nEvalua si existe informacion suficiente para que el Consejo delibere con fiabilidad sobre este problema. Si falta informacion clave (presupuesto, contexto, restricciones, objetivo, plazo, etc.), NO la inventes: pregunta.\n\n${JSON_INSTRUCTIONS_DISCOVERY}\n\n${getLanguageInstruction(
    locale
  )} (Manten los nombres de los campos JSON en ingles; solo el contenido de los valores debe estar en ese idioma.)`;
}

function tryParseDiscovery(raw: string): DiscoveryAssessment | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const parsed = JSON.parse(candidate);
    return {
      sufficient: Boolean(parsed.sufficient),
      reason: String(parsed.reason ?? ""),
      missingInformation: Array.isArray(parsed.missingInformation)
        ? parsed.missingInformation.map(String)
        : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions.map(String).slice(0, 7) : [],
      completeness: Math.max(0, Math.min(100, Number(parsed.completeness) || 0)),
    };
  } catch {
    return null;
  }
}

export interface AssessDiscoveryInput {
  problem: string;
  history: DiscoveryQA[];
  round: number;
  useDemoMode?: boolean;
  locale?: Locale;
  mockAI?: boolean;
}

// Fase de Discovery (v0.5): antes de convocar a los especialistas, el
// Moderador evalua si hay informacion suficiente para deliberar con
// fiabilidad. Si no la hay, formula preguntas en vez de forzar una
// recomendacion prematura. "Understand First. Deliberate Later."
export async function assessDiscovery({
  problem,
  history,
  round,
  useDemoMode = false,
  locale,
  mockAI = false,
}: AssessDiscoveryInput): Promise<DiscoveryAssessment> {
  if (round > MAX_DISCOVERY_ROUNDS) {
    return {
      sufficient: true,
      reason: "Se alcanzo el limite de rondas de Discovery; el Consejo delibera con la informacion disponible.",
      missingInformation: [],
      questions: [],
      completeness: 100,
    };
  }

  const moderator = getModeratorRole();
  const providerId = useDemoMode ? SIMULATOR_PROVIDER : moderator.provider;
  const model = useDemoMode ? SIMULATOR_MODEL : moderator.model;
  const provider = getProvider(providerId);

  if (mockAI || !provider.isConfigured()) {
    if (mockAI || useDemoMode) {
      return generateDemoDiscovery(problem, round);
    }
    return {
      sufficient: true,
      reason: `El proveedor "${providerId}" no esta configurado; el Consejo delibera igualmente.`,
      missingInformation: [],
      questions: [],
      completeness: 100,
    };
  }

  try {
    const result = await provider.generate({
      model,
      systemPrompt: moderator.basePrompt,
      userPrompt: buildDiscoveryPrompt(problem, history, locale),
    });
    return (
      tryParseDiscovery(result.text) ?? {
        sufficient: true,
        reason: "",
        missingInformation: [],
        questions: [],
        completeness: 100,
      }
    );
  } catch (err) {
    // Fail-open: un error al evaluar Discovery nunca debe bloquear al
    // Presidente indefinidamente, simplemente se pasa a deliberar.
    return {
      sufficient: true,
      reason: `No se pudo evaluar Discovery (${friendlyProviderErrorMessage(err)}); el Consejo delibera con la informacion disponible.`,
      missingInformation: [],
      questions: [],
      completeness: 100,
    };
  }
}
