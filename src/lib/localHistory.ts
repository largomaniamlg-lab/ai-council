import type {
  AgentResponse,
  CouncilMinutes,
  DiscoveryQA,
  PresidentDecision,
  SessionOutcome,
} from "@/lib/types";
import type { CouncilMode } from "@/config/councilRoles";
import type { Locale } from "@/lib/i18n";

// v0.5.1 Session History: cuando Supabase no esta configurado, la sesion
// se guarda igualmente, pero en localStorage en vez de en la base de
// datos. Misma forma de datos que SessionDetail, para poder reutilizar el
// mismo codigo de hidratacion en AppShell independientemente del backend.

const STORAGE_KEY = "ai-council-local-sessions";

export interface LocalSession {
  id: string;
  title: string;
  problem: string;
  mode: CouncilMode;
  locale: Locale;
  discoveryHistory: DiscoveryQA[];
  responses: AgentResponse[];
  minutesHistory: (CouncilMinutes & { markdown: string })[];
  decision: PresidentDecision | null;
  outcome: SessionOutcome | null;
  createdAt: string;
  updatedAt: string;
}

function readAll(): LocalSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: LocalSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage lleno o no disponible (modo privado, etc.): se ignora,
    // la sesion simplemente no queda guardada localmente.
  }
}

export function listLocalSessions(): LocalSession[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalSession(id: string): LocalSession | null {
  return readAll().find((s) => s.id === id) ?? null;
}

export function saveLocalSession(session: LocalSession): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.push(session);
  }
  writeAll(all);
}

export function deleteLocalSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
