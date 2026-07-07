import type { CouncilMode, ModelProvider } from "@/config/councilRoles";

export interface AgentResponse {
  roleId: string;
  roleName: string;
  provider: ModelProvider;
  model: string;
  round: number;
  prompt: string;
  response: string;
  error?: string;
  // Autoevaluacion del especialista (0-100), si el modelo la ha incluido.
  confidence?: number;
  // Tiempo real que tardo la llamada al proveedor, en milisegundos.
  elapsedMs?: number;
  // Solo presente en rondas de deliberacion (round > 1): si el especialista
  // mantiene su postura anterior o la revisa a la luz del challenge del
  // Presidente.
  stance?: "maintain" | "revise";
}

export interface OrchestratorResult {
  problem: string;
  mode: CouncilMode;
  roles: string[];
  responses: AgentResponse[];
}

export interface CouncilMinutes {
  // Ronda de deliberacion a la que pertenece esta acta (1 = consulta
  // inicial; 2+ = rondas generadas tras un "Challenge the Council").
  round: number;
  // true si esta acta viene de un "quick follow-up" solo al Moderador
  // (no se convoco a ningun especialista para generarla).
  isModeratorOnly?: boolean;
  summary: string;
  agreements: string[];
  disagreements: string[];
  risks: string[];
  openQuestions: string[];
  recommendation: string;
  // Solo en rondas de deliberacion (round > 1): si el Consejo en conjunto
  // mantiene su recomendacion anterior, la revisa, o hay posturas mixtas.
  verdict?: "maintained" | "revised" | "mixed";
  // Nota del Moderador sobre si el Consejo esta convergiendo hacia una
  // conclusion estable o si persiste el desacuerdo.
  convergenceNote?: string;
}

export interface PresidentDecision {
  finalDecision: string;
  rationale: string;
  expectedResult: string;
}

export interface SessionOutcome {
  actualResult: string;
  whatWorked: string;
  whatFailed: string;
  lessons: string;
}
