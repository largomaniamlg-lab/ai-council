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
