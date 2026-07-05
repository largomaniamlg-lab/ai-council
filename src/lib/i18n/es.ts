import type { Dictionary } from "./types";

export const es: Dictionary = {
  meta: {
    title: "AI Council",
    description: "Consejo de IA - sistema de toma de decisiones asistido por varias IA",
  },
  common: {
    appName: "AI Council",
    presidentTag: "Consejo de IA - Presidente: tu",
    back: "Volver",
    roundLabel: "ronda",
  },
  header: {
    openMenu: "Abrir menu",
  },
  sidebar: {
    closeMenu: "Cerrar menu",
    supabaseWarning:
      "Supabase no esta configurado. Puedes consultar al Consejo, pero los proyectos y sesiones no se guardaran. Revisa el README.",
    newProjectPlaceholder: "Nuevo proyecto...",
    projectsLabel: "Proyectos",
    noProjects: "Sin proyectos todavia.",
    newConsultation: "+ Nueva consulta",
    historyLabel: "Historial de sesiones",
    noSessions: "Sin sesiones todavia.",
    settingsLink: "Configuracion",
  },
  form: {
    problemLabel: "Decision o problema",
    problemPlaceholder: "Ej: Deberia lanzar BioPod como suscripcion o pago unico?",
    engineLabel: "Motor del Consejo",
    simulatorButton: "Council Simulator",
    liveButton: "Live Mode",
    simulatorHint:
      'Un unico modelo gratuito interpreta a todos los especialistas (mismo Consejo, misma interfaz). Sin API key configurada, usa plantillas locales de respaldo. Cambia a "Live Mode" para que cada rol use el proveedor real configurado, sin que cambie nada mas en la app.',
    modeLabel: "Modo",
    expertRolesLabel: "Especialistas a convocar",
    consultButton: "Consultar al Consejo",
    consultingButton: "Consultando al Consejo...",
    currentProblemLabel: "Problema en curso:",
  },
  modes: {
    rapido: { label: "Rapido", description: "Riesgos + Analista Critico. Bajo coste." },
    completo: {
      label: "Consejo completo",
      description: "Riesgos, Critico, Creativo, Investigador, CFO y Moderador.",
    },
    debate: {
      label: "Debate",
      description: "Primera ronda independiente, segunda ronda respondiendo a desacuerdos.",
    },
    experto: { label: "Experto", description: "Eliges tu mismo que especialistas convocar." },
  },
  roles: {
    riesgos: {
      name: "Director de Riesgos",
      shortDescription:
        "Analiza probabilidades, escenarios, planificacion, riesgos operativos y puntos de fallo.",
      thinkingLabel: "Evaluando riesgos...",
    },
    critico: {
      name: "Analista Critico",
      shortDescription:
        "Busca debilidades, inconsistencias, supuestos ocultos, contradicciones y escenarios alternativos.",
      thinkingLabel: "Buscando debilidades...",
    },
    creativo: {
      name: "Director Creativo",
      shortDescription:
        "Genera ideas, branding, narrativa, diseno, enfoques no convencionales y oportunidades.",
      thinkingLabel: "Generando ideas...",
    },
    investigador: {
      name: "Investigador",
      shortDescription:
        "Busca informacion actualizada, competencia, datos tecnicos, legislacion y referencias.",
      thinkingLabel: "Buscando informacion...",
    },
    cfo: {
      name: "Economista / CFO",
      shortDescription:
        "Evalua costes, rentabilidad, cash flow, pricing, riesgo financiero y retorno de inversion.",
      thinkingLabel: "Analizando numeros...",
    },
    legal: {
      name: "Legal / Compliance",
      shortDescription:
        "Detecta riesgos legales, privacidad, contratos, licencias, regulaciones y obligaciones.",
      thinkingLabel: "Revisando aspectos legales...",
    },
    etico: {
      name: "Etico / Reputacional",
      shortDescription:
        "Evalua impacto social, confianza, reputacion, seguridad y posibles consecuencias no deseadas.",
      thinkingLabel: "Evaluando impacto etico...",
    },
    abogado_diablo: {
      name: "Abogado del Diablo",
      shortDescription: "Defiende la postura contraria para evitar pensamiento grupal.",
      thinkingLabel: "Buscando el contraargumento...",
    },
    moderador: {
      name: "Moderador",
      shortDescription:
        "Ordena las respuestas, identifica acuerdos y desacuerdos, formula preguntas y genera el acta final.",
      thinkingLabel: "Redactando el acta...",
    },
  },
  errors: {
    consultFailed: "Error al consultar al Consejo.",
    minutesFailed: "Error al generar el acta.",
    unexpected: "Error inesperado.",
  },
  acta: {
    title: "Acta del Consejo",
    waitingForResponse: "Aqui aparecera el acta final una vez el Consejo responda.",
    copyMarkdown: "Copiar Markdown",
    copied: "Copiado!",
    exportMd: "Exportar .md",
    summary: "Resumen",
    noSummary: "Sin resumen",
    agreements: "Acuerdos",
    disagreements: "Desacuerdos",
    risks: "Riesgos",
    openQuestions: "Preguntas abiertas",
    none: "Ninguno",
    recommendation: "Recomendacion",
    noRecommendation: "Sin recomendacion",
    presidentDecision: "Decision del Presidente",
    finalDecisionPlaceholder: "Tu decision final...",
    rationalePlaceholder: "Razonamiento...",
    expectedResultPlaceholder: "Resultado esperado...",
    saveDecision: "Guardar decision",
    decisionSaved: "Decision guardada ✓",
    saving: "Guardando...",
    notPersistedNoProject:
      "Esta sesion no se ha guardado en un proyecto, la decision no se persistira.",
    notPersistedNoSupabase:
      "Supabase no configurado: la decision no se persistira, solo queda en pantalla.",
    registerOutcome: "Registrar resultado real (mas adelante)",
    outcomeTitle: "Resultado y aprendizajes",
    actualResultPlaceholder: "Que ocurrio en la realidad...",
    whatWorkedPlaceholder: "Que funciono...",
    whatFailedPlaceholder: "Que fallo...",
    lessonsPlaceholder: "Aprendizajes para el proximo Consejo...",
    saveOutcome: "Guardar resultado",
    outcomeSaved: "Resultado guardado ✓",
  },
  settings: {
    title: "Configuracion",
    backToConsole: "Volver al Consejo",
    languageSection: "Idioma",
    languageHint: "Los cambios se aplican al instante, sin recargar.",
    themeSection: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    speedSection: "Velocidad de revelado",
    speedHint: "Con que rapidez los especialistas revelan sus respuestas uno tras otro.",
    speedFast: "Rapida",
    speedNormal: "Normal",
    speedSlow: "Lenta",
    devModeSection: "Modo desarrollador",
    devModeHint: "Muestra informacion tecnica extra (proveedor, modelo, prompts) en cada respuesta.",
    devModeOn: "Activado",
    devModeOff: "Desactivado",
    engineSection: "Council Engine",
    engineHint: "El modelo que usa actualmente el Council Simulator para todos los roles.",
    engineSimulatorModel: "Modelo del simulador",
    engineProvider: "Proveedor",
    enginePlan: "Plan",
    engineStatus: "Estado",
    statusConnected: "Conectado",
    statusNotConnected: "No conectado",
    apiStatusSection: "Estado de las API",
    apiStatusHint: "Solo lectura. Las API keys se configuran unicamente en el servidor (.env.local).",
    apiConfigured: "Configurada",
    apiNotConfigured: "No configurada",
    apiChecking: "Comprobando...",
  },
};
