"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ModeSelector from "@/components/ModeSelector";
import RolePicker from "@/components/RolePicker";
import SpecialistCard from "@/components/SpecialistCard";
import PendingCard from "@/components/PendingCard";
import ActaPanel from "@/components/ActaPanel";
import DiscoveryPanel from "@/components/DiscoveryPanel";
import type { Project, Session } from "@/lib/data";
import { getLocalSession, saveLocalSession } from "@/lib/localHistory";
import { MAX_TEXT_LENGTH } from "@/lib/validation";
import {
  getRoleById,
  resolveRolesForMode,
  type CouncilMode,
  type CouncilRole,
} from "@/config/councilRoles";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSettings } from "@/lib/settings/SettingsProvider";
import type {
  AgentResponse,
  CouncilMinutes,
  DiscoveryAssessment,
  DiscoveryQA,
  PresidentDecision,
  SessionOutcome,
} from "@/lib/types";

interface MinutesState extends CouncilMinutes {
  markdown: string;
}

function maxRound(responses: AgentResponse[]): number {
  return responses.length ? Math.max(...responses.map((r) => r.round)) : 1;
}

export default function AppShell({
  initialProjects,
  supabaseConfigured,
}: {
  initialProjects: Project[];
  supabaseConfigured: boolean;
}) {
  const { t } = useTranslation();
  const { revealDelayMs, locale } = useSettings();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjects[0]?.id ?? null
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [problem, setProblem] = useState("");
  const [mode, setMode] = useState<CouncilMode>("rapido");
  const [manualRoleIds, setManualRoleIds] = useState<string[]>([]);
  // Por defecto en modo demo (gratis): no requiere ninguna API key configurada.
  const [useDemoMode, setUseDemoMode] = useState(true);

  const [isConsulting, setIsConsulting] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<string | null>(null);
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [minutesHistory, setMinutesHistory] = useState<MinutesState[]>([]);
  const [decision, setDecision] = useState<PresidentDecision | null>(null);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<CouncilRole[]>([]);
  const [isChallenging, setIsChallenging] = useState(false);
  const [isAskingModerator, setIsAskingModerator] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  // v0.5 Discovery Mode: "Understand First. Deliberate Later." Antes de
  // convocar a los especialistas, el Moderador evalua si hay informacion
  // suficiente; si no, pregunta en vez de forzar un veredicto prematuro.
  const [discoveryStatus, setDiscoveryStatus] = useState<"idle" | "checking" | "awaiting_answer">(
    "idle"
  );
  const [discoveryHistory, setDiscoveryHistory] = useState<DiscoveryQA[]>([]);
  const [discoveryAssessment, setDiscoveryAssessment] = useState<DiscoveryAssessment | null>(null);

  // v0.5.1 Session History: cuando Supabase no esta configurado, la sesion
  // se guarda igualmente, pero en localStorage (ver src/lib/localHistory.ts).
  const [localSessionId, setLocalSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      if (!selectedProjectId || !supabaseConfigured) {
        if (!cancelled) setSessions([]);
        return;
      }
      try {
        const res = await fetch(`/api/sessions?projectId=${selectedProjectId}`);
        const data = await res.json();
        if (!cancelled) setSessions(data.sessions ?? []);
      } catch {
        if (!cancelled) setSessions([]);
      }
    }

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, supabaseConfigured]);

  // v0.5.1 Session History (fallback local): mientras la sesion avanza
  // (Discovery, rondas, decision...), se refleja en localStorage si
  // Supabase no esta configurado, para que /history pueda listarla.
  useEffect(() => {
    if (supabaseConfigured || !localSessionId || !currentProblem) return;
    const existing = getLocalSession(localSessionId);
    saveLocalSession({
      id: localSessionId,
      title: currentProblem.slice(0, 80),
      problem: currentProblem,
      mode,
      locale,
      discoveryHistory,
      responses,
      minutesHistory,
      decision,
      outcome,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [
    supabaseConfigured,
    localSessionId,
    currentProblem,
    mode,
    locale,
    discoveryHistory,
    responses,
    minutesHistory,
    decision,
    outcome,
  ]);

  function hydrateFromDetail(
    detail: {
      session: { problem: string; mode: CouncilMode };
      responses: AgentResponse[];
      minutesHistory: MinutesState[];
      decision: PresidentDecision | null;
      outcome: SessionOutcome | null;
      discoveryHistory: DiscoveryQA[];
    },
    sessionId: string,
    projectId?: string | null
  ) {
    setSelectedSessionId(sessionId);
    if (projectId) setSelectedProjectId(projectId);
    setCurrentProblem(detail.session.problem);
    setMode(detail.session.mode);
    setResponses(detail.responses ?? []);
    setMinutesHistory(detail.minutesHistory ?? []);
    setDecision(detail.decision ?? null);
    setOutcome(detail.outcome ?? null);
    setDiscoveryHistory(detail.discoveryHistory ?? []);
    setDiscoveryStatus("idle");
    setDiscoveryAssessment(null);
    setPendingRoles([]);
    setError(null);
    setChallengeError(null);
  }

  // v0.5.1 Session History: al llegar desde /history con ?openSession=<id>,
  // se abre esa sesion (desde Supabase o desde localStorage segun el caso).
  useEffect(() => {
    const openSessionId = new URLSearchParams(window.location.search).get("openSession");
    if (!openSessionId) return;

    async function openSession() {
      if (supabaseConfigured) {
        const res = await fetch(`/api/sessions/${openSessionId}`);
        const data = await res.json();
        if (!data.error) hydrateFromDetail(data, openSessionId!, data.session.project_id);
      } else {
        const local = getLocalSession(openSessionId!);
        if (local) {
          setLocalSessionId(local.id);
          hydrateFromDetail(
            {
              session: { problem: local.problem, mode: local.mode },
              responses: local.responses,
              minutesHistory: local.minutesHistory,
              decision: local.decision,
              outcome: local.outcome,
              discoveryHistory: local.discoveryHistory,
            },
            local.id,
            null
          );
        }
      }
      window.history.replaceState({}, "", "/");
    }

    openSession();
  }, [supabaseConfigured]);

  async function handleCreateProject(name: string) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.project) {
      setProjects((prev) => [data.project, ...prev]);
      setSelectedProjectId(data.project.id);
    } else if (data.error) {
      setError(data.error);
    }
  }

  function resetConsultation() {
    setSelectedSessionId(null);
    setProblem("");
    setCurrentProblem(null);
    setResponses([]);
    setPendingRoles([]);
    setMinutesHistory([]);
    setDecision(null);
    setOutcome(null);
    setError(null);
    setChallengeError(null);
    setDiscoveryStatus("idle");
    setDiscoveryHistory([]);
    setDiscoveryAssessment(null);
    setLocalSessionId(null);
  }

  async function handleSelectSession(sessionId: string) {
    setError(null);
    setChallengeError(null);
    setPendingRoles([]);
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    hydrateFromDetail(data, sessionId, data.session.project_id);
  }

  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Revela las respuestas una a una, con una breve pausa entre cada una,
  // para que la sesion se sienta como una reunion en vivo en lugar de un
  // volcado instantaneo de texto.
  async function revealResponsesSequentially(allResponses: AgentResponse[]) {
    let currentRound = allResponses[0]?.round ?? 1;

    for (const r of allResponses) {
      if (r.round !== currentRound) {
        currentRound = r.round;
        const roundRoles = allResponses
          .filter((x) => x.round === currentRound)
          .map((x) => getRoleById(x.roleId))
          .filter((role): role is CouncilRole => Boolean(role));
        setPendingRoles(roundRoles);
      }
      await sleep(revealDelayMs);
      setResponses((prev) => [...prev, r]);
      setPendingRoles((prev) => prev.filter((p) => p.id !== r.roleId));
    }
  }

  function buildEnrichedProblem(original: string, history: DiscoveryQA[]): string {
    if (history.length === 0) return original;
    const context = history
      .map(
        (h, i) =>
          `Preguntas del Consejo (Discovery, ronda ${i + 1}): ${h.questions.join(" | ")}\nRespuesta del Presidente: ${h.answer}`
      )
      .join("\n\n");
    return `${original}\n\nContexto adicional aportado por el Presidente durante Discovery:\n${context}`;
  }

  async function checkDiscovery(history: DiscoveryQA[], round: number): Promise<DiscoveryAssessment> {
    const res = await fetch("/api/council/discovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, history, round, useDemoMode, locale }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? t("errors.unexpected"));
    return data.assessment as DiscoveryAssessment;
  }

  async function runFullConsultation(enrichedProblem: string, finalDiscoveryHistory: DiscoveryQA[]) {
    setIsConsulting(true);
    setSelectedSessionId(null);
    setResponses([]);
    setPendingRoles(resolveRolesForMode(mode, mode === "experto" ? manualRoleIds : undefined));

    if (!supabaseConfigured) {
      setLocalSessionId(crypto.randomUUID());
    }

    try {
      const sessionRes = await fetch("/api/council/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId ?? undefined,
          title: problem.slice(0, 80),
          problem: enrichedProblem,
          mode,
          manualRoleIds: mode === "experto" ? manualRoleIds : undefined,
          useDemoMode,
          locale,
          discoveryHistory: finalDiscoveryHistory,
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        setError(sessionData.error ?? t("errors.consultFailed"));
        setPendingRoles([]);
        return;
      }

      await revealResponsesSequentially(sessionData.responses ?? []);
      if (sessionData.sessionId) {
        setSelectedSessionId(sessionData.sessionId);
        setSessions((prev) => [
          {
            id: sessionData.sessionId,
            project_id: selectedProjectId!,
            title: problem.slice(0, 80),
            problem: enrichedProblem,
            mode,
            locale: locale ?? null,
            discovery_history: finalDiscoveryHistory,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      setIsConsulting(false);

      setIsGeneratingMinutes(true);
      const minutesRes = await fetch("/api/council/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.sessionId ?? null,
          problem: enrichedProblem,
          responses: sessionData.responses,
          useDemoMode,
          locale,
        }),
      });
      const minutesData = await minutesRes.json();
      if (minutesRes.ok) {
        setMinutesHistory([{ ...minutesData.minutes, markdown: minutesData.markdown }]);
      } else {
        setError(minutesData.error ?? t("errors.minutesFailed"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unexpected"));
    } finally {
      setIsConsulting(false);
      setIsGeneratingMinutes(false);
      setPendingRoles([]);
    }
  }

  // v0.5 Discovery Mode: al pulsar "Consult the Council" no se convoca a
  // los especialistas directamente. Primero el Moderador evalua si hay
  // informacion suficiente ("Understand First. Deliberate Later.").
  async function handleConsult() {
    if (!problem.trim()) return;
    setError(null);
    setChallengeError(null);
    setMinutesHistory([]);
    setDecision(null);
    setOutcome(null);
    setCurrentProblem(problem);
    setDiscoveryHistory([]);
    setDiscoveryAssessment(null);
    setDiscoveryStatus("checking");

    try {
      const assessment = await checkDiscovery([], 1);
      if (assessment.sufficient) {
        setDiscoveryStatus("idle");
        await runFullConsultation(problem, []);
      } else {
        setDiscoveryAssessment(assessment);
        setDiscoveryStatus("awaiting_answer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unexpected"));
      setDiscoveryStatus("idle");
    }
  }

  async function handleAnswerDiscovery(answer: string) {
    if (!discoveryAssessment) return;
    const newHistory = [...discoveryHistory, { questions: discoveryAssessment.questions, answer }];
    setDiscoveryHistory(newHistory);
    setDiscoveryStatus("checking");

    try {
      const assessment = await checkDiscovery(newHistory, newHistory.length + 1);
      if (assessment.sufficient) {
        setDiscoveryStatus("idle");
        setDiscoveryAssessment(null);
        await runFullConsultation(buildEnrichedProblem(problem, newHistory), newHistory);
      } else {
        setDiscoveryAssessment(assessment);
        setDiscoveryStatus("awaiting_answer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unexpected"));
      setDiscoveryStatus("idle");
    }
  }

  // "Challenge the Council": modo A (re-deliberacion completa, vuelve a
  // convocar a los mismos especialistas) o modo B (quick follow-up solo al
  // Moderador, sin convocar a nadie). Ver AI Council v0.4 (Deliberative
  // Council) para el diseno completo.
  async function handleChallenge(challenge: string, mode: "full" | "moderator") {
    if (!currentProblem || minutesHistory.length === 0) return;
    const latestMinutes = minutesHistory[minutesHistory.length - 1];
    const sessionRoleIds = Array.from(new Set(responses.map((r) => r.roleId)));
    const round = maxRound(responses);
    const nextRound = round + 1;

    setChallengeError(null);

    if (mode === "full") {
      setIsChallenging(true);
      setPendingRoles(
        sessionRoleIds.map((id) => getRoleById(id)).filter((r): r is CouncilRole => Boolean(r))
      );
      try {
        const res = await fetch("/api/council/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            problem: currentProblem,
            roleIds: sessionRoleIds,
            history: responses,
            latestMinutes,
            challenge,
            challengeMode: "full",
            nextRound,
            useDemoMode,
            locale,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setChallengeError(data.error ?? t("errors.consultFailed"));
          return;
        }
        await revealResponsesSequentially(data.responses ?? []);
        setMinutesHistory((prev) => [...prev, { ...data.minutes, markdown: data.markdown }]);
      } catch (err) {
        setChallengeError(err instanceof Error ? err.message : t("errors.unexpected"));
      } finally {
        setIsChallenging(false);
        setPendingRoles([]);
      }
    } else {
      setIsAskingModerator(true);
      try {
        const res = await fetch("/api/council/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            problem: currentProblem,
            roleIds: sessionRoleIds,
            history: responses,
            latestMinutes,
            challenge,
            challengeMode: "moderator",
            nextRound,
            useDemoMode,
            locale,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setChallengeError(data.error ?? t("errors.minutesFailed"));
          return;
        }
        setMinutesHistory((prev) => [...prev, { ...data.minutes, markdown: data.markdown }]);
      } catch (err) {
        setChallengeError(err instanceof Error ? err.message : t("errors.unexpected"));
      } finally {
        setIsAskingModerator(false);
      }
    }
  }

  async function handleSaveDecision(newDecision: PresidentDecision) {
    setDecision(newDecision);
    if (!selectedSessionId) return;
    await fetch("/api/council/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selectedSessionId, ...newDecision }),
    });
  }

  async function handleSaveOutcome(newOutcome: SessionOutcome) {
    setOutcome(newOutcome);
    if (!selectedSessionId) return;
    await fetch("/api/council/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: selectedSessionId, ...newOutcome }),
    });
  }

  const labelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500";

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-100 dark:bg-slate-950 md:h-screen md:flex-row md:overflow-hidden">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label={t("header.openMenu")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
        >
          <span className="sr-only">{t("header.openMenu")}</span>
          &#9776;
        </button>
        <span className="font-bold text-slate-900 dark:text-slate-100">{t("common.appName")}</span>
      </header>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <Sidebar
        projects={projects}
        supabaseConfigured={supabaseConfigured}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => {
          setSelectedProjectId(id);
          resetConsultation();
          setSidebarOpen(false);
        }}
        onCreateProject={handleCreateProject}
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        onSelectSession={(id) => {
          handleSelectSession(id);
          setSidebarOpen(false);
        }}
        onNewConsultation={() => {
          resetConsultation();
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex flex-1 flex-col p-4 md:overflow-y-auto md:p-6">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <label className={labelClass}>{t("form.problemLabel")}</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder={t("form.problemPlaceholder")}
              rows={3}
              maxLength={MAX_TEXT_LENGTH}
              className="mb-1 w-full resize-none rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
              {t("form.privacyNotice")}
            </p>

            <label className={labelClass}>{t("form.engineLabel")}</label>
            <div className="mb-3 flex rounded-md bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setUseDemoMode(true)}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                  useDemoMode
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {t("form.simulatorButton")}
              </button>
              <button
                type="button"
                onClick={() => setUseDemoMode(false)}
                className={`flex-1 rounded px-3 py-1.5 transition-colors ${
                  !useDemoMode
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {t("form.liveButton")}
              </button>
            </div>
            {useDemoMode && (
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                {t("form.simulatorHint")}
              </p>
            )}

            <label className={labelClass}>{t("form.modeLabel")}</label>
            <ModeSelector mode={mode} onChange={setMode} />

            {mode === "experto" && (
              <div className="mt-3">
                <label className={labelClass}>{t("form.expertRolesLabel")}</label>
                <RolePicker
                  selected={manualRoleIds}
                  onToggle={(id) =>
                    setManualRoleIds((prev) =>
                      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
                    )
                  }
                />
              </div>
            )}

            <button
              onClick={handleConsult}
              disabled={
                !problem.trim() ||
                isConsulting ||
                discoveryStatus !== "idle" ||
                (mode === "experto" && manualRoleIds.length === 0)
              }
              className="mt-4 w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
            >
              {isConsulting || discoveryStatus === "checking"
                ? t("form.consultingButton")
                : t("form.consultButton")}
            </button>

            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          {currentProblem && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <span>&#127963;</span>
                <span>{t("common.sessionStarted")}</span>
              </div>
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t("form.currentProblemLabel")}
              </span>{" "}
              {currentProblem}
            </div>
          )}

          {discoveryStatus === "checking" && !discoveryAssessment && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("discovery.checking")}</p>
          )}

          {discoveryAssessment && discoveryStatus !== "idle" && (
            <DiscoveryPanel
              assessment={discoveryAssessment}
              isSubmitting={discoveryStatus === "checking"}
              onAnswer={handleAnswerDiscovery}
            />
          )}

          <div className="flex flex-col gap-3">
            {responses.map((r, i) => (
              <SpecialistCard key={`${r.roleId}-${r.round}-${i}`} response={r} />
            ))}
            {pendingRoles.map((role) => (
              <PendingCard key={`pending-${role.id}`} role={role} />
            ))}
          </div>

          <div className="md:hidden">
            <ActaPanel
              key={`${selectedSessionId ?? "draft"}-mobile`}
              minutesHistory={minutesHistory}
              responses={responses}
              isGeneratingMinutes={isGeneratingMinutes}
              isChallenging={isChallenging}
              isAskingModerator={isAskingModerator}
              currentRound={maxRound(responses)}
              challengeError={challengeError}
              onChallenge={handleChallenge}
              sessionId={selectedSessionId}
              supabaseConfigured={supabaseConfigured}
              initialDecision={decision}
              initialOutcome={outcome}
              onSaveDecision={handleSaveDecision}
              onSaveOutcome={handleSaveOutcome}
            />
          </div>
        </div>
      </main>

      <div className="hidden md:block">
        <ActaPanel
          key={`${selectedSessionId ?? "draft"}-desktop`}
          minutesHistory={minutesHistory}
          responses={responses}
          isGeneratingMinutes={isGeneratingMinutes}
          isChallenging={isChallenging}
          isAskingModerator={isAskingModerator}
          currentRound={maxRound(responses)}
          challengeError={challengeError}
          onChallenge={handleChallenge}
          sessionId={selectedSessionId}
          supabaseConfigured={supabaseConfigured}
          initialDecision={decision}
          initialOutcome={outcome}
          onSaveDecision={handleSaveDecision}
          onSaveOutcome={handleSaveOutcome}
        />
      </div>
    </div>
  );
}
