"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import ModeSelector from "@/components/ModeSelector";
import RolePicker from "@/components/RolePicker";
import SpecialistCard from "@/components/SpecialistCard";
import PendingCard from "@/components/PendingCard";
import ActaPanel from "@/components/ActaPanel";
import type { Project, Session } from "@/lib/data";
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
  PresidentDecision,
  SessionOutcome,
} from "@/lib/types";

interface MinutesState extends CouncilMinutes {
  markdown: string;
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
  const [minutes, setMinutes] = useState<MinutesState | null>(null);
  const [decision, setDecision] = useState<PresidentDecision | null>(null);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<CouncilRole[]>([]);

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
    setMinutes(null);
    setDecision(null);
    setOutcome(null);
    setError(null);
  }

  async function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setError(null);
    setPendingRoles([]);
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    setCurrentProblem(data.session.problem);
    setResponses(data.responses ?? []);
    setMinutes(data.minutes ?? null);
    setDecision(data.decision ?? null);
    setOutcome(data.outcome ?? null);
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

  async function handleConsult() {
    if (!problem.trim()) return;
    setError(null);
    setIsConsulting(true);
    setMinutes(null);
    setDecision(null);
    setOutcome(null);
    setSelectedSessionId(null);
    setCurrentProblem(problem);
    setResponses([]);
    setPendingRoles(resolveRolesForMode(mode, mode === "experto" ? manualRoleIds : undefined));

    try {
      const sessionRes = await fetch("/api/council/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId ?? undefined,
          problem,
          mode,
          manualRoleIds: mode === "experto" ? manualRoleIds : undefined,
          useDemoMode,
          locale,
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
            problem,
            mode,
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
          problem,
          responses: sessionData.responses,
          useDemoMode,
          locale,
        }),
      });
      const minutesData = await minutesRes.json();
      if (minutesRes.ok) {
        setMinutes({ ...minutesData.minutes, markdown: minutesData.markdown });
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
              className="mb-3 w-full resize-none rounded-md border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

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
                (mode === "experto" && manualRoleIds.length === 0)
              }
              className="mt-4 w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
            >
              {isConsulting ? t("form.consultingButton") : t("form.consultButton")}
            </button>

            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          {currentProblem && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t("form.currentProblemLabel")}
              </span>{" "}
              {currentProblem}
            </div>
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
              minutes={minutes}
              isGeneratingMinutes={isGeneratingMinutes}
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
          minutes={minutes}
          isGeneratingMinutes={isGeneratingMinutes}
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
