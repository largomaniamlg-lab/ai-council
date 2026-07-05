import type { Locale } from "@/lib/i18n";

// Instruccion de idioma que se anade a cada prompt enviado a la IA, para
// que el contenido generado (no solo la interfaz) respete el idioma
// elegido por el Presidente en Settings.
const LANGUAGE_INSTRUCTIONS: Record<Locale, string> = {
  en: "Respond in English.",
  es: "Responde en espanol.",
  nb: "Svar pa norsk bokmal.",
};

export function getLanguageInstruction(locale?: Locale): string {
  if (locale && locale in LANGUAGE_INSTRUCTIONS) {
    return LANGUAGE_INSTRUCTIONS[locale];
  }
  return LANGUAGE_INSTRUCTIONS.en;
}
