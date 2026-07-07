import type { CouncilRole } from "@/config/councilRoles";
import type { CouncilMinutes, DiscoveryAssessment } from "@/lib/types";

// Contenido simulado para el Modo Demo: permite probar todo el flujo del
// Consejo (roles, acta, decision, resultado) sin gastar nada en APIs de IA.
// No sustituye el analisis real, solo sirve para validar la experiencia.

const DEMO_TAG = "[Respuesta simulada - modo demo]";

const templates: Record<string, (problem: string) => string> = {
  riesgos: (problem) => `${DEMO_TAG}

Resumen: analisis de riesgos para "${problem}".

Riesgos principales:
- Riesgo operativo si no se dimensiona bien el equipo o el tiempo disponible.
- Riesgo de mercado si la demanda real es menor a la esperada.
- Riesgo financiero por el coste de mantenimiento continuo.

Probabilidad: media. Impacto: alto.

Mitigaciones: validar con una prueba reducida antes de comprometer todos los recursos.

Escenarios:
- Mejor caso: adopcion rapida y bajo coste de soporte.
- Caso medio: adopcion gradual, con ajustes en los primeros meses.
- Peor caso: baja adopcion, hay que pivotar el enfoque.

Recomendacion: avanzar con una prueba controlada y metricas claras de exito.`,

  critico: (problem) => `${DEMO_TAG}

Objeciones a "${problem}":
- ¿Se ha validado la demanda real o es todavia una suposicion?
- ¿Que pasa si el coste de conseguir cada usuario es mayor al estimado?
- Posible exceso de confianza en la idea inicial sin datos que la respalden.

Como comprobarlo: hablar con varios usuarios potenciales reales antes de invertir mas tiempo en construir.`,

  creativo: (problem) => `${DEMO_TAG}

Ideas para "${problem}":
- Explorar un enfoque de marca mas personal y menos generico.
- Probar un lanzamiento por invitacion para generar exclusividad inicial.
- Buscar una alianza con una comunidad afin para la primera tanda de usuarios.`,

  investigador: (problem) => `${DEMO_TAG}

Informacion que conviene verificar sobre "${problem}":
- Quienes son los competidores directos e indirectos.
- Que regulacion podria aplicar segun la region de lanzamiento.
- Que datos de mercado existen sobre la demanda real.

Nota: en modo demo no se ha consultado ninguna fuente real; esto es solo un ejemplo de que preguntar.`,

  cfo: (problem) => `${DEMO_TAG}

Analisis financiero de "${problem}":
- Coste estimado de desarrollo y mantenimiento: medio.
- Posible pricing: modelo de suscripcion con periodo de prueba gratuito.
- El punto de equilibrio depende del volumen de usuarios activos; revisar con datos reales.`,

  legal: (problem) => `${DEMO_TAG}

Riesgos legales de "${problem}":
- Revisar la politica de privacidad si se manejan datos de usuarios.
- Verificar si aplica alguna licencia de terceros usada en el proyecto.`,

  etico: (problem) => `${DEMO_TAG}

Impacto etico y reputacional de "${problem}":
- Evaluar cuanta transparencia se ofrece al usuario sobre el uso de IA.
- Considerar el efecto en la confianza si algo sale mal.`,

  abogado_diablo: (problem) => `${DEMO_TAG}

Postura contraria a "${problem}":
- Quiza no merece la pena hacerlo ahora mismo; podria ser mejor validar otras hipotesis primero.
- El tiempo invertido aqui podria rendir mas en otra prioridad.`,
};

export function generateDemoResponse(role: CouncilRole, problem: string): string {
  const template = templates[role.id];
  if (template) return template(problem);
  return `${DEMO_TAG}\n\n${role.name} analiza: "${problem}". (Sin plantilla especifica para este rol todavia.)`;
}

// Confianza fija por rol para el modo demo (plantillas locales), solo para
// que la tarjeta de confianza tenga algo coherente que mostrar sin una IA
// real detras.
const DEMO_CONFIDENCE: Record<string, number> = {
  riesgos: 72,
  critico: 65,
  creativo: 80,
  investigador: 55,
  cfo: 70,
  legal: 68,
  etico: 66,
  abogado_diablo: 60,
  moderador: 75,
};

export function getDemoConfidence(role: CouncilRole): number {
  return DEMO_CONFIDENCE[role.id] ?? 65;
}

// Respuesta simulada para una ronda de deliberacion (Challenge the
// Council) en modo demo: no razona de verdad sobre el challenge, solo
// mantiene el flujo de la app operativo sin ninguna API key configurada.
export function generateDemoChallengeResponse(
  role: CouncilRole,
  problem: string,
  challenge: string
): string {
  return `${DEMO_TAG}

${role.name} reconsidera "${problem}" a la luz de tu comentario: "${challenge}".

En modo demo se mantiene la postura anterior sin cambios sustanciales; activa Live Mode para una reconsideracion real basada en IA.`;
}

// Evaluacion simulada de Discovery (v0.5): en modo demo no razona de
// verdad sobre si falta informacion, solo ejemplifica el flujo para poder
// probarlo sin ninguna API key configurada. Primera ronda: pide contexto
// generico. A partir de la segunda: da por suficiente para no bloquear la
// demo indefinidamente.
export function generateDemoDiscovery(problem: string, round: number): DiscoveryAssessment {
  if (round === 1) {
    return {
      sufficient: false,
      reason: `${DEMO_TAG} La peticion "${problem}" es demasiado amplia para deliberar con fiabilidad.`,
      missingInformation: ["Presupuesto disponible", "Uso previsto", "Plazo para decidir"],
      questions: [
        "Cual es tu presupuesto aproximado?",
        "Para que lo vas a usar principalmente?",
        "En cuanto tiempo necesitas tomar la decision?",
      ],
      completeness: 35,
    };
  }
  return {
    sufficient: true,
    reason: `${DEMO_TAG} Informacion suficiente para deliberar.`,
    missingInformation: [],
    questions: [],
    completeness: 90,
  };
}

export function generateDemoMinutes(
  problem: string
): Omit<CouncilMinutes, "round" | "isModeratorOnly" | "verdict" | "convergenceNote"> {
  return {
    summary: `${DEMO_TAG} El Consejo analizo: "${problem}" en modo simulacion, sin llamadas reales a IA.`,
    agreements: ["Conviene validar la idea con datos reales antes de invertir mas recursos."],
    disagreements: [
      "El Abogado del Diablo cuestiona si es el momento adecuado, mientras otros roles ven la oportunidad como valida.",
    ],
    risks: [
      "Riesgo de construir sin validar antes la demanda real.",
      "Riesgo de subestimar el coste de mantenimiento.",
    ],
    openQuestions: [
      "¿Cual es el tamano real del mercado objetivo?",
      "¿Cuanto estaria dispuesto a pagar el usuario?",
    ],
    recommendation:
      "Esta es un acta de ejemplo generada en modo demo. Activa el modo real (con una API key configurada) para obtener una recomendacion basada en IA real.",
  };
}
