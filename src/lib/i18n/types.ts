export interface RoleTranslation {
  name: string;
  shortDescription: string;
  thinkingLabel: string;
}

export interface ModeTranslation {
  label: string;
  description: string;
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
  };
  common: {
    appName: string;
    presidentTag: string;
    back: string;
    roundLabel: string;
    sessionStarted: string;
    reportSubmitted: string;
    confidenceLow: string;
    confidenceMedium: string;
    confidenceHigh: string;
    councilAdjourned: string;
  };
  header: {
    openMenu: string;
  };
  sidebar: {
    closeMenu: string;
    supabaseWarning: string;
    newProjectPlaceholder: string;
    projectsLabel: string;
    noProjects: string;
    newConsultation: string;
    historyLabel: string;
    noSessions: string;
    settingsLink: string;
    historyLink: string;
  };
  form: {
    problemLabel: string;
    problemPlaceholder: string;
    engineLabel: string;
    simulatorButton: string;
    liveButton: string;
    simulatorHint: string;
    modeLabel: string;
    expertRolesLabel: string;
    consultButton: string;
    consultingButton: string;
    currentProblemLabel: string;
    recommendedBadge: string;
  };
  modes: {
    rapido: ModeTranslation;
    completo: ModeTranslation;
    debate: ModeTranslation;
    experto: ModeTranslation;
  };
  roles: Record<string, RoleTranslation>;
  errors: {
    consultFailed: string;
    minutesFailed: string;
    unexpected: string;
  };
  acta: {
    title: string;
    waitingForResponse: string;
    copyMarkdown: string;
    copied: string;
    exportMd: string;
    summary: string;
    noSummary: string;
    agreements: string;
    disagreements: string;
    risks: string;
    openQuestions: string;
    none: string;
    recommendation: string;
    noRecommendation: string;
    presidentDecision: string;
    finalDecisionPlaceholder: string;
    rationalePlaceholder: string;
    expectedResultPlaceholder: string;
    saveDecision: string;
    decisionSaved: string;
    saving: string;
    notPersistedNoProject: string;
    notPersistedNoSupabase: string;
    registerOutcome: string;
    outcomeTitle: string;
    actualResultPlaceholder: string;
    whatWorkedPlaceholder: string;
    whatFailedPlaceholder: string;
    lessonsPlaceholder: string;
    saveOutcome: string;
    outcomeSaved: string;
    roundHeading: string;
    roundOfLabel: string;
    verdictMaintained: string;
    verdictRevised: string;
    verdictMixed: string;
    stanceMaintain: string;
    stanceRevise: string;
    trendUp: string;
    trendDown: string;
    trendStable: string;
    challengeSectionTitle: string;
    challengePlaceholder: string;
    challengeButton: string;
    challenging: string;
    askModeratorButton: string;
    askingModerator: string;
    maxRoundsReached: string;
    moderatorOnlyTag: string;
    challengeConsumptionHint: string;
  };
  settings: {
    title: string;
    backToConsole: string;
    languageSection: string;
    languageHint: string;
    themeSection: string;
    themeLight: string;
    themeDark: string;
    speedSection: string;
    speedHint: string;
    speedFast: string;
    speedNormal: string;
    speedSlow: string;
    devModeSection: string;
    devModeHint: string;
    devModeOn: string;
    devModeOff: string;
    engineSection: string;
    engineHint: string;
    engineSimulatorModel: string;
    engineProvider: string;
    enginePlan: string;
    engineStatus: string;
    statusConnected: string;
    statusNotConnected: string;
    apiStatusSection: string;
    apiStatusHint: string;
    apiConfigured: string;
    apiNotConfigured: string;
    apiChecking: string;
  };
  discovery: {
    checking: string;
    title: string;
    completenessLabel: string;
    missingInformationLabel: string;
    questionsLabel: string;
    answerPlaceholder: string;
    continueButton: string;
    continuing: string;
  };
  history: {
    title: string;
    backToConsole: string;
    searchPlaceholder: string;
    filterProjectLabel: string;
    filterModeLabel: string;
    filterLocaleLabel: string;
    allProjects: string;
    allModes: string;
    allLocales: string;
    noSessions: string;
    noSupabaseHint: string;
    statusInProgress: string;
    statusCompleted: string;
    statusDecisionSaved: string;
    openButton: string;
    deleteButton: string;
    deleteConfirm: string;
    exportButton: string;
    roundsLabel: string;
    createdLabel: string;
    noRecommendationYet: string;
  };
}
