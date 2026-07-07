"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ConfidenceTrend } from "@/lib/confidenceParsing";
import type { CouncilMinutes } from "@/lib/types";

const VERDICT_STYLES: Record<NonNullable<CouncilMinutes["verdict"]>, string> = {
  maintained: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  revised: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  mixed: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
};

export function VerdictBadge({ verdict }: { verdict: NonNullable<CouncilMinutes["verdict"]> }) {
  const { t } = useTranslation();
  const label =
    verdict === "revised"
      ? t("acta.verdictRevised")
      : verdict === "mixed"
        ? t("acta.verdictMixed")
        : t("acta.verdictMaintained");

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VERDICT_STYLES[verdict]}`}>
      {label}
    </span>
  );
}

const TREND_ICON: Record<ConfidenceTrend, string> = {
  up: "↑",
  down: "↓",
  stable: "≈",
};

const TREND_STYLES: Record<ConfidenceTrend, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  stable: "text-slate-500 dark:text-slate-400",
};

export function TrendBadge({ trend }: { trend: ConfidenceTrend }) {
  const { t } = useTranslation();
  const label = trend === "up" ? t("acta.trendUp") : trend === "down" ? t("acta.trendDown") : t("acta.trendStable");

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${TREND_STYLES[trend]}`}>
      <span aria-hidden>{TREND_ICON[trend]}</span>
      {label}
    </span>
  );
}
