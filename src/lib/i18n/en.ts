import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    title: "AI Council",
    description: "AI Council - a decision-making system assisted by multiple AIs",
  },
  common: {
    appName: "AI Council",
    presidentTag: "AI Council - President: you",
    back: "Back",
    roundLabel: "round",
  },
  header: {
    openMenu: "Open menu",
  },
  sidebar: {
    closeMenu: "Close menu",
    supabaseWarning:
      "Supabase is not configured. You can still consult the Council, but projects and sessions won't be saved. Check the README.",
    newProjectPlaceholder: "New project...",
    projectsLabel: "Projects",
    noProjects: "No projects yet.",
    newConsultation: "+ New consultation",
    historyLabel: "Session history",
    noSessions: "No sessions yet.",
    settingsLink: "Settings",
  },
  form: {
    problemLabel: "Decision or problem",
    problemPlaceholder: "E.g.: Should I launch BioPod as a subscription or one-time payment?",
    engineLabel: "Council engine",
    simulatorButton: "Council Simulator",
    liveButton: "Live Mode",
    simulatorHint:
      'A single free model plays every specialist (same Council, same interface). Without an API key it falls back to local templates. Switch to "Live Mode" so each role uses its configured real provider, with nothing else changing in the app.',
    modeLabel: "Mode",
    expertRolesLabel: "Specialists to convene",
    consultButton: "Consult the Council",
    consultingButton: "Consulting the Council...",
    currentProblemLabel: "Current problem:",
  },
  modes: {
    rapido: { label: "Quick", description: "Risk Director + Critical Analyst. Low cost." },
    completo: {
      label: "Full Council",
      description: "Risk, Critic, Creative, Researcher, CFO and Moderator.",
    },
    debate: {
      label: "Debate",
      description: "First round independent, second round responding to disagreements.",
    },
    experto: { label: "Expert", description: "You choose which specialists to convene." },
  },
  roles: {
    riesgos: {
      name: "Risk Director",
      shortDescription:
        "Analyzes probabilities, scenarios, planning, operational risks and failure points.",
      thinkingLabel: "Assessing risks...",
    },
    critico: {
      name: "Critical Analyst",
      shortDescription:
        "Looks for weaknesses, inconsistencies, hidden assumptions, contradictions and alternative scenarios.",
      thinkingLabel: "Looking for weaknesses...",
    },
    creativo: {
      name: "Creative Director",
      shortDescription:
        "Generates ideas, branding, narrative, design, unconventional approaches and opportunities.",
      thinkingLabel: "Generating ideas...",
    },
    investigador: {
      name: "Researcher",
      shortDescription:
        "Looks for up-to-date information, competitors, technical data, legislation and references.",
      thinkingLabel: "Gathering information...",
    },
    cfo: {
      name: "Economist / CFO",
      shortDescription:
        "Evaluates costs, profitability, cash flow, pricing, financial risk and return on investment.",
      thinkingLabel: "Crunching the numbers...",
    },
    legal: {
      name: "Legal / Compliance",
      shortDescription:
        "Detects legal risks, privacy, contracts, licenses, regulations and obligations.",
      thinkingLabel: "Reviewing legal aspects...",
    },
    etico: {
      name: "Ethics / Reputation",
      shortDescription:
        "Evaluates social impact, trust, reputation, safety and possible unintended consequences.",
      thinkingLabel: "Evaluating ethical impact...",
    },
    abogado_diablo: {
      name: "Devil's Advocate",
      shortDescription: "Defends the opposite position to avoid groupthink.",
      thinkingLabel: "Looking for the counter-argument...",
    },
    moderador: {
      name: "Moderator",
      shortDescription:
        "Orders the responses, identifies agreements and disagreements, asks questions and produces the final minutes.",
      thinkingLabel: "Drafting the minutes...",
    },
  },
  errors: {
    consultFailed: "Error consulting the Council.",
    minutesFailed: "Error generating the minutes.",
    unexpected: "Unexpected error.",
  },
  acta: {
    title: "Council Minutes",
    waitingForResponse: "The final minutes will appear here once the Council responds.",
    copyMarkdown: "Copy Markdown",
    copied: "Copied!",
    exportMd: "Export .md",
    summary: "Summary",
    noSummary: "No summary",
    agreements: "Agreements",
    disagreements: "Disagreements",
    risks: "Risks",
    openQuestions: "Open questions",
    none: "None",
    recommendation: "Recommendation",
    noRecommendation: "No recommendation",
    presidentDecision: "President's decision",
    finalDecisionPlaceholder: "Your final decision...",
    rationalePlaceholder: "Rationale...",
    expectedResultPlaceholder: "Expected result...",
    saveDecision: "Save decision",
    decisionSaved: "Decision saved ✓",
    saving: "Saving...",
    notPersistedNoProject:
      "This session hasn't been saved to a project, the decision won't be persisted.",
    notPersistedNoSupabase:
      "Supabase not configured: the decision won't be persisted, it only stays on screen.",
    registerOutcome: "Register real outcome (later)",
    outcomeTitle: "Outcome and lessons learned",
    actualResultPlaceholder: "What actually happened...",
    whatWorkedPlaceholder: "What worked...",
    whatFailedPlaceholder: "What failed...",
    lessonsPlaceholder: "Lessons for the next Council session...",
    saveOutcome: "Save outcome",
    outcomeSaved: "Outcome saved ✓",
  },
  settings: {
    title: "Settings",
    backToConsole: "Back to the Council",
    languageSection: "Language",
    languageHint: "Changes apply immediately, no reload needed.",
    themeSection: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    speedSection: "Reveal speed",
    speedHint: "How fast specialists reveal their responses one after another.",
    speedFast: "Fast",
    speedNormal: "Normal",
    speedSlow: "Slow",
    devModeSection: "Developer mode",
    devModeHint: "Shows extra technical info (provider, model, prompts) on each response.",
    devModeOn: "On",
    devModeOff: "Off",
    engineSection: "Council Engine",
    engineHint: "The model currently used by the Council Simulator for every role.",
    engineSimulatorModel: "Simulator model",
    engineProvider: "Provider",
    enginePlan: "Plan",
    engineStatus: "Status",
    statusConnected: "Connected",
    statusNotConnected: "Not connected",
    apiStatusSection: "API status",
    apiStatusHint: "Read-only. API keys are only set server-side in .env.local.",
    apiConfigured: "Configured",
    apiNotConfigured: "Not configured",
    apiChecking: "Checking...",
  },
};
