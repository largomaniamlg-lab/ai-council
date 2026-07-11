// Limite de longitud para cualquier texto libre que escriba el Presidente
// (problema, challenge, respuestas de Discovery, decision, resultado).
// Evita que una entrada desmesurada infle el coste/tiempo de los prompts o
// sirva como vector de abuso trivial contra la cuota gratuita.
export const MAX_TEXT_LENGTH = 4000;

export function isValidText(value: unknown, max = MAX_TEXT_LENGTH): value is string {
  return typeof value === "string" && value.length <= max;
}

export function isValidOptionalText(value: unknown, max = MAX_TEXT_LENGTH): boolean {
  return value === undefined || isValidText(value, max);
}
