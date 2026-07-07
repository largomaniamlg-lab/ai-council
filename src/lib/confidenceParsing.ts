// Instruccion que se anade a cada prompt para que el propio especialista
// autoevalue su confianza, y utilidad para separar esa linea del texto
// que se muestra al Presidente.

export const CONFIDENCE_INSTRUCTION =
  "En una ultima linea separada del resto, escribe exactamente: CONFIDENCE: <numero de 0 a 100> indicando tu grado de confianza en este analisis. No escribas nada despues de esa linea.";

const CONFIDENCE_REGEX = /\n?\**CONFIDENCE\**:\s*(\d{1,3})\s*%?\s*$/i;

export function extractConfidence(rawText: string): { text: string; confidence?: number } {
  const match = rawText.match(CONFIDENCE_REGEX);
  if (!match) {
    return { text: rawText };
  }
  const value = Math.max(0, Math.min(100, parseInt(match[1], 10)));
  return { text: rawText.slice(0, match.index).trimEnd(), confidence: value };
}

export type ConfidenceLevel = "low" | "medium" | "high";

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 71) return "high";
  if (confidence >= 41) return "medium";
  return "low";
}

// Instruccion para rondas de deliberacion (Challenge the Council): el
// especialista debe declarar primero si mantiene o revisa su postura
// anterior, antes de desarrollar su analisis.
export const STANCE_INSTRUCTION =
  "En la primera linea de tu respuesta, escribe exactamente: STANCE: MAINTAIN o STANCE: REVISE, segun si mantienes tu postura anterior o la revisas a la luz de la nueva informacion. Si la revisas, explica claramente por que en el cuerpo de tu respuesta.";

const STANCE_REGEX = /^\s*\**STANCE\**:\s*(MAINTAIN|REVISE)\s*\n+/i;

export function extractStance(rawText: string): { text: string; stance?: "maintain" | "revise" } {
  const match = rawText.match(STANCE_REGEX);
  if (!match) return { text: rawText };
  const stance: "maintain" | "revise" = match[1].toUpperCase() === "REVISE" ? "revise" : "maintain";
  return { text: rawText.slice(match[0].length), stance };
}

export type ConfidenceTrend = "up" | "down" | "stable";

// Compara la confianza media de una ronda de especialistas con la de la
// ronda anterior, para mostrar si el Consejo converge (confianza sube o se
// mantiene) o si el desacuerdo persiste (confianza baja).
export function averageConfidence(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function confidenceTrend(previousAvg: number | null, currentAvg: number | null): ConfidenceTrend | null {
  if (previousAvg === null || currentAvg === null) return null;
  const delta = currentAvg - previousAvg;
  if (Math.abs(delta) < 3) return "stable";
  return delta > 0 ? "up" : "down";
}
