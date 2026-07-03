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
}

export interface OrchestratorResult {
  problem: string;
  mode: CouncilMode;
  roles: string[];
  responses: AgentResponse[];
}

export interface CouncilMinutes {
  summary: string;
  agreements: string[];
  disagreements: string[];
  risks: string[];
  openQuestions: string[];
  recommendation: string;
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
