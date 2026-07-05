// Definicion de los roles fijos del Consejo de IA.
// Cada rol tiene una responsabilidad estable y un prompt base que se envia
// al proveedor de IA correspondiente para simular ese especialista.

export type CouncilMode = "rapido" | "completo" | "debate" | "experto";

export type ModelProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openrouter"
  | "xai";

export interface CouncilRole {
  id: string;
  name: string;
  shortDescription: string;
  basePrompt: string;
  provider: ModelProvider;
  model: string;
  color: string;
  isModerator?: boolean;
  // Texto que se muestra mientras el especialista "delibera", para que la
  // sesion se sienta como una reunion en vivo en lugar de una carga generica.
  thinkingLabel: string;
}

// Modelo/proveedor por defecto para el MVP. Todos los roles usan el mismo
// proveedor inicialmente (OpenAI) y se diferencian solo por el prompt.
const DEFAULT_PROVIDER: ModelProvider = "openai";
const DEFAULT_MODEL = "gpt-4o-mini";

export const councilRoles: CouncilRole[] = [
  {
    id: "riesgos",
    name: "Director de Riesgos",
    shortDescription:
      "Analiza probabilidades, escenarios, planificacion, riesgos operativos y puntos de fallo.",
    basePrompt: `Actua como Director de Riesgos del Consejo de IA. Analiza la decision de forma estructurada. Devuelve: resumen, riesgos principales, probabilidad, impacto, mitigaciones, escenarios mejor/medio/peor, preguntas necesarias y recomendacion.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#dc2626",
    thinkingLabel: "Evaluando riesgos...",
  },
  {
    id: "critico",
    name: "Analista Critico",
    shortDescription:
      "Busca debilidades, inconsistencias, supuestos ocultos, contradicciones y escenarios alternativos.",
    basePrompt: `Actua como Analista Critico. Tu trabajo es encontrar fallos, contradicciones, sesgos, supuestos ocultos y razones por las que la idea podria fracasar. No seas complaciente. Devuelve objeciones concretas y como comprobarlas.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#7c3aed",
    thinkingLabel: "Buscando debilidades...",
  },
  {
    id: "creativo",
    name: "Director Creativo",
    shortDescription:
      "Genera ideas, branding, narrativa, diseno, enfoques no convencionales y oportunidades.",
    basePrompt: `Actua como Director Creativo. Busca oportunidades, enfoques originales, branding, posicionamiento, narrativa, experiencia de usuario y alternativas no evidentes. Devuelve ideas accionables.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#db2777",
    thinkingLabel: "Generando ideas...",
  },
  {
    id: "investigador",
    name: "Investigador",
    shortDescription:
      "Busca informacion actualizada, competencia, datos tecnicos, legislacion y referencias.",
    basePrompt: `Actua como Investigador. Identifica que informacion falta, que datos deben verificarse, que fuentes consultar, competidores, regulaciones o referencias tecnicas relevantes. No inventes datos. Si no tienes acceso a informacion en tiempo real, indica claramente que datos deberia aportar el Presidente.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#0891b2",
    thinkingLabel: "Buscando informacion...",
  },
  {
    id: "cfo",
    name: "Economista / CFO",
    shortDescription:
      "Evalua costes, rentabilidad, cash flow, pricing, riesgo financiero y retorno de inversion.",
    basePrompt: `Actua como CFO. Evalua costes, ingresos potenciales, pricing, margen, riesgos financieros, metricas clave y condiciones para que el proyecto sea rentable.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#059669",
    thinkingLabel: "Analizando numeros...",
  },
  {
    id: "legal",
    name: "Legal / Compliance",
    shortDescription:
      "Detecta riesgos legales, privacidad, contratos, licencias, regulaciones y obligaciones.",
    basePrompt: `Actua como responsable Legal y de Compliance del Consejo de IA. Detecta riesgos legales, de privacidad, contratos, licencias, regulaciones y obligaciones relevantes para la decision. Devuelve riesgos concretos y como mitigarlos.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#4338ca",
    thinkingLabel: "Revisando aspectos legales...",
  },
  {
    id: "etico",
    name: "Etico / Reputacional",
    shortDescription:
      "Evalua impacto social, confianza, reputacion, seguridad y posibles consecuencias no deseadas.",
    basePrompt: `Actua como responsable Etico y Reputacional. Evalua el impacto social, la confianza, la reputacion, la seguridad y las posibles consecuencias no deseadas de la decision. Devuelve riesgos y recomendaciones.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#0d9488",
    thinkingLabel: "Evaluando impacto etico...",
  },
  {
    id: "abogado_diablo",
    name: "Abogado del Diablo",
    shortDescription: "Defiende la postura contraria para evitar pensamiento grupal.",
    basePrompt: `Actua como Abogado del Diablo. Defiende la decision contraria a la intuicion del Presidente o al consenso del Consejo. Tu objetivo es evitar pensamiento grupal.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#ea580c",
    thinkingLabel: "Buscando el contraargumento...",
  },
  {
    id: "moderador",
    name: "Moderador",
    shortDescription:
      "Ordena las respuestas, identifica acuerdos y desacuerdos, formula preguntas y genera el acta final.",
    basePrompt: `Actua como Moderador del Consejo. Recibe todos los informes y produce un acta clara con resumen, acuerdos, desacuerdos, riesgos, preguntas abiertas, recomendacion y decision pendiente del Presidente.`,
    provider: DEFAULT_PROVIDER,
    model: DEFAULT_MODEL,
    color: "#334155",
    isModerator: true,
    thinkingLabel: "Redactando el acta...",
  },
];

export function getRoleById(id: string): CouncilRole | undefined {
  return councilRoles.find((r) => r.id === id);
}

export function getSpecialistRoles(): CouncilRole[] {
  return councilRoles.filter((r) => !r.isModerator);
}

export function getModeratorRole(): CouncilRole {
  const moderator = councilRoles.find((r) => r.isModerator);
  if (!moderator) throw new Error("No se ha definido el rol Moderador");
  return moderator;
}

// Roles convocados por defecto segun el modo elegido por el Presidente.
export const rolesByMode: Record<Exclude<CouncilMode, "experto">, string[]> = {
  rapido: ["riesgos", "critico"],
  completo: ["riesgos", "critico", "creativo", "investigador", "cfo"],
  debate: ["riesgos", "critico", "creativo", "investigador", "cfo"],
};

export function resolveRolesForMode(
  mode: CouncilMode,
  manualRoleIds?: string[]
): CouncilRole[] {
  if (mode === "experto") {
    const ids = manualRoleIds ?? [];
    return ids
      .map((id) => getRoleById(id))
      .filter((r): r is CouncilRole => Boolean(r) && !r?.isModerator);
  }
  return rolesByMode[mode].map((id) => getRoleById(id)!).filter(Boolean);
}
