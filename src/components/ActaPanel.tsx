"use client";

import { useEffect, useState } from "react";
import { getModeratorRole } from "@/config/councilRoles";
import PendingCard from "@/components/PendingCard";
import { VerdictBadge, TrendBadge } from "@/components/VerdictBadge";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { averageConfidence, confidenceTrend, type ConfidenceTrend } from "@/lib/confidenceParsing";
import { MAX_DELIBERATION_ROUNDS } from "@/lib/orchestrator";
import type { AgentResponse, CouncilMinutes, PresidentDecision, SessionOutcome } from "@/lib/types";

type MinutesRound = CouncilMinutes & { markdown: string };

function AdjournedStamp() {
  const { t } = useTranslation();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSettled(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 self-start rounded border-2 border-emerald-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600 transition-all duration-500 dark:border-emerald-500 dark:text-emerald-500 ${
        settled ? "scale-100 rotate-0 opacity-100" : "scale-125 -rotate-6 opacity-0"
      }`}
    >
      &#9989; {t("common.councilAdjourned")}
    </div>
  );
}

function Section({ title, items, noneLabel }: { title: string; items: string[]; noneLabel: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">{noneLabel}</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function computeTrendForRound(round: number, responses: AgentResponse[]): ConfidenceTrend | null {
  const priorRounds = Array.from(
    new Set(responses.filter((r) => r.round < round).map((r) => r.round))
  ).sort((a, b) => b - a);
  const priorRound = priorRounds[0];
  if (priorRound === undefined) return null;

  const thisRoundAvg = averageConfidence(
    responses.filter((r) => r.round === round && typeof r.confidence === "number").map((r) => r.confidence!)
  );
  const priorRoundAvg = averageConfidence(
    responses.filter((r) => r.round === priorRound && typeof r.confidence === "number").map((r) => r.confidence!)
  );
  return confidenceTrend(priorRoundAvg, thisRoundAvg);
}

function MinutesRoundBlock({
  round,
  responses,
  t,
}: {
  round: MinutesRound;
  responses: AgentResponse[];
  t: (path: `acta.${string}`) => string;
}) {
  const trend = round.round > 1 && !round.isModeratorOnly ? computeTrendForRound(round.round, responses) : null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("acta.roundHeading")} {round.round}
        </span>
        {round.isModeratorOnly && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-400">
            {t("acta.moderatorOnlyTag")}
          </span>
        )}
        {round.verdict && <VerdictBadge verdict={round.verdict} />}
        {trend && <TrendBadge trend={trend} />}
      </div>

      <AdjournedStamp />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("acta.summary")}
        </h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {round.summary || t("acta.noSummary")}
        </p>
      </div>

      <Section title={t("acta.agreements")} items={round.agreements} noneLabel={t("acta.none")} />
      <Section title={t("acta.disagreements")} items={round.disagreements} noneLabel={t("acta.none")} />
      <Section title={t("acta.risks")} items={round.risks} noneLabel={t("acta.none")} />
      <Section title={t("acta.openQuestions")} items={round.openQuestions} noneLabel={t("acta.none")} />

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("acta.recommendation")}
        </h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {round.recommendation || t("acta.noRecommendation")}
        </p>
      </div>

      {round.convergenceNote && (
        <p className="text-sm italic text-slate-500 dark:text-slate-400">{round.convergenceNote}</p>
      )}
    </div>
  );
}

export default function ActaPanel({
  minutesHistory,
  responses,
  isGeneratingMinutes,
  isChallenging,
  isAskingModerator,
  currentRound,
  challengeError,
  onChallenge,
  sessionId,
  supabaseConfigured,
  initialDecision,
  initialOutcome,
  onSaveDecision,
  onSaveOutcome,
}: {
  minutesHistory: MinutesRound[];
  responses: AgentResponse[];
  isGeneratingMinutes: boolean;
  isChallenging: boolean;
  isAskingModerator: boolean;
  currentRound: number;
  challengeError: string | null;
  onChallenge: (challenge: string, mode: "full" | "moderator") => void;
  sessionId: string | null;
  supabaseConfigured: boolean;
  initialDecision: PresidentDecision | null;
  initialOutcome: SessionOutcome | null;
  onSaveDecision: (decision: PresidentDecision) => Promise<void>;
  onSaveOutcome: (outcome: SessionOutcome) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [finalDecision, setFinalDecision] = useState(initialDecision?.finalDecision ?? "");
  const [rationale, setRationale] = useState(initialDecision?.rationale ?? "");
  const [expectedResult, setExpectedResult] = useState(initialDecision?.expectedResult ?? "");
  const [decisionSaved, setDecisionSaved] = useState(Boolean(initialDecision));
  const [savingDecision, setSavingDecision] = useState(false);

  const [showOutcomeForm, setShowOutcomeForm] = useState(Boolean(initialOutcome));
  const [actualResult, setActualResult] = useState(initialOutcome?.actualResult ?? "");
  const [whatWorked, setWhatWorked] = useState(initialOutcome?.whatWorked ?? "");
  const [whatFailed, setWhatFailed] = useState(initialOutcome?.whatFailed ?? "");
  const [lessons, setLessons] = useState(initialOutcome?.lessons ?? "");
  const [outcomeSaved, setOutcomeSaved] = useState(Boolean(initialOutcome));
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeText, setChallengeText] = useState("");

  const inputClass =
    "mb-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  const latestMinutes = minutesHistory[minutesHistory.length - 1] ?? null;
  const busy = isChallenging || isAskingModerator;
  const roundCapReached = currentRound >= MAX_DELIBERATION_ROUNDS;

  async function handleSaveDecision() {
    if (!finalDecision.trim()) return;
    setSavingDecision(true);
    try {
      await onSaveDecision({ finalDecision, rationale, expectedResult });
      setDecisionSaved(true);
    } finally {
      setSavingDecision(false);
    }
  }

  async function handleSaveOutcome() {
    setSavingOutcome(true);
    try {
      await onSaveOutcome({ actualResult, whatWorked, whatFailed, lessons });
      setOutcomeSaved(true);
    } finally {
      setSavingOutcome(false);
    }
  }

  function combinedMarkdown(): string {
    return minutesHistory.map((m) => m.markdown).join("\n\n---\n\n");
  }

  function handleCopy() {
    if (!minutesHistory.length) return;
    navigator.clipboard.writeText(combinedMarkdown()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleExport() {
    if (!minutesHistory.length) return;
    const blob = new Blob([combinedMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "acta-consejo.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmitChallenge(mode: "full" | "moderator") {
    if (!challengeText.trim() || busy) return;
    onChallenge(challengeText.trim(), mode);
    setChallengeText("");
  }

  return (
    <aside className="flex w-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:w-96 md:shrink-0 md:rounded-none md:border-y-0 md:border-r-0 md:border-l md:shadow-none md:overflow-y-auto">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("acta.title")}
      </h2>

      {isGeneratingMinutes && <PendingCard role={getModeratorRole()} />}

      {!isGeneratingMinutes && minutesHistory.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          {t("acta.waitingForResponse")}
        </p>
      )}

      {minutesHistory.length > 0 && (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
            >
              {copied ? t("acta.copied") : t("acta.copyMarkdown")}
            </button>
            <button
              onClick={handleExport}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
            >
              {t("acta.exportMd")}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {minutesHistory.map((round, i) => (
              <MinutesRoundBlock key={`${round.round}-${round.isModeratorOnly ? "mod" : "full"}-${i}`} round={round} responses={responses} t={t} />
            ))}
          </div>

          {isAskingModerator && <PendingCard role={getModeratorRole()} />}

          <hr className="border-slate-200 dark:border-slate-700" />

          {latestMinutes && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t("acta.challengeSectionTitle")}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t("acta.roundHeading")} {currentRound} {t("acta.roundOfLabel")} {MAX_DELIBERATION_ROUNDS}
              </span>
              <textarea
                value={challengeText}
                onChange={(e) => setChallengeText(e.target.value)}
                placeholder={t("acta.challengePlaceholder")}
                rows={3}
                disabled={busy}
                className={inputClass}
              />
              {challengeError && (
                <p className="text-sm text-red-600 dark:text-red-400">{challengeError}</p>
              )}
              {roundCapReached && (
                <p className="text-sm text-amber-700 dark:text-amber-400">{t("acta.maxRoundsReached")}</p>
              )}
              <button
                onClick={() => handleSubmitChallenge("full")}
                disabled={!challengeText.trim() || busy || roundCapReached}
                className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
              >
                {isChallenging ? t("acta.challenging") : t("acta.challengeButton")}
              </button>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("acta.challengeConsumptionHint")}
              </p>
              <button
                onClick={() => handleSubmitChallenge("moderator")}
                disabled={!challengeText.trim() || busy}
                className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
              >
                {isAskingModerator ? t("acta.askingModerator") : t("acta.askModeratorButton")}
              </button>
            </div>
          )}

          <hr className="border-slate-200 dark:border-slate-700" />

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {t("acta.presidentDecision")}
            </h3>
            <textarea
              value={finalDecision}
              onChange={(e) => setFinalDecision(e.target.value)}
              placeholder={t("acta.finalDecisionPlaceholder")}
              rows={3}
              className={inputClass}
            />
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={t("acta.rationalePlaceholder")}
              rows={2}
              className={inputClass}
            />
            <textarea
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder={t("acta.expectedResultPlaceholder")}
              rows={2}
              className={inputClass}
            />
            <button
              onClick={handleSaveDecision}
              disabled={!finalDecision.trim() || savingDecision}
              className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
            >
              {decisionSaved
                ? t("acta.decisionSaved")
                : savingDecision
                  ? t("acta.saving")
                  : t("acta.saveDecision")}
            </button>
            {!sessionId && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {supabaseConfigured
                  ? t("acta.notPersistedNoProject")
                  : t("acta.notPersistedNoSupabase")}
              </p>
            )}
          </div>

          {decisionSaved && (
            <div>
              {!showOutcomeForm ? (
                <button
                  onClick={() => setShowOutcomeForm(true)}
                  className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
                >
                  {t("acta.registerOutcome")}
                </button>
              ) : (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t("acta.outcomeTitle")}
                  </h3>
                  <textarea
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    placeholder={t("acta.actualResultPlaceholder")}
                    rows={2}
                    className={inputClass}
                  />
                  <textarea
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                    placeholder={t("acta.whatWorkedPlaceholder")}
                    rows={2}
                    className={inputClass}
                  />
                  <textarea
                    value={whatFailed}
                    onChange={(e) => setWhatFailed(e.target.value)}
                    placeholder={t("acta.whatFailedPlaceholder")}
                    rows={2}
                    className={inputClass}
                  />
                  <textarea
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    placeholder={t("acta.lessonsPlaceholder")}
                    rows={2}
                    className={inputClass}
                  />
                  <button
                    onClick={handleSaveOutcome}
                    disabled={savingOutcome}
                    className="w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {outcomeSaved
                      ? t("acta.outcomeSaved")
                      : savingOutcome
                        ? t("acta.saving")
                        : t("acta.saveOutcome")}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
