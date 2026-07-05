"use client";

import { confidenceLevel } from "@/lib/confidenceParsing";
import { useTranslation } from "@/lib/i18n/useTranslation";

const LEVEL_STYLES = {
  low: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
} as const;

const LEVEL_DOT = {
  low: "bg-red-500",
  medium: "bg-amber-500",
  high: "bg-emerald-500",
} as const;

export default function ConfidenceBadge({ confidence }: { confidence: number }) {
  const { t } = useTranslation();
  const level = confidenceLevel(confidence);
  const label =
    level === "high"
      ? t("common.confidenceHigh")
      : level === "medium"
        ? t("common.confidenceMedium")
        : t("common.confidenceLow");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[level]}`} />
      {label}
    </span>
  );
}
