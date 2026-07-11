"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { MAX_TEXT_LENGTH } from "@/lib/validation";
import type { DiscoveryAssessment } from "@/lib/types";

export default function DiscoveryPanel({
  assessment,
  isSubmitting,
  onAnswer,
}: {
  assessment: DiscoveryAssessment;
  isSubmitting: boolean;
  onAnswer: (answer: string) => void;
}) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState("");

  function handleSubmit() {
    if (!answer.trim() || isSubmitting) return;
    onAnswer(answer.trim());
    setAnswer("");
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("discovery.title")}
      </h2>

      {assessment.reason && (
        <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">{assessment.reason}</p>
      )}

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("discovery.completenessLabel")}</span>
          <span>{assessment.completeness}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${Math.max(4, Math.min(100, assessment.completeness))}%` }}
          />
        </div>
      </div>

      {assessment.missingInformation.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("discovery.missingInformationLabel")}
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-400">
            {assessment.missingInformation.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {assessment.questions.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("discovery.questionsLabel")}
          </h3>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
            {assessment.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={t("discovery.answerPlaceholder")}
        rows={3}
        disabled={isSubmitting}
        maxLength={MAX_TEXT_LENGTH}
        className="mb-3 w-full resize-none rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() || isSubmitting}
        className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
      >
        {isSubmitting ? t("discovery.continuing") : t("discovery.continueButton")}
      </button>
    </div>
  );
}
