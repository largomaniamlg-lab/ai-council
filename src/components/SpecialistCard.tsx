"use client";

import { useEffect, useState } from "react";
import { getRoleById } from "@/config/councilRoles";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSettings } from "@/lib/settings/SettingsProvider";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import type { AgentResponse } from "@/lib/types";

function formatElapsed(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SpecialistCard({ response }: { response: AgentResponse }) {
  const role = getRoleById(response.roleId);
  const color = role?.color ?? "#334155";
  const { t, tRole } = useTranslation();
  const { devMode } = useSettings();
  const displayName = (role && tRole(role.id)?.name) ?? response.roleName;

  // Entrada suave + insignia "Report submitted" que se desvanece a los
  // pocos segundos, para que se note el momento en que el especialista
  // "entrega" su informe en la sesion en vivo.
  const [mounted, setMounted] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const timeout = setTimeout(() => setJustSubmitted(false), 1600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-semibold text-slate-800 dark:text-slate-100">{displayName}</span>
          {response.round > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              {t("common.roundLabel")} {response.round}
            </span>
          )}
          {!response.error && justSubmitted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-opacity duration-500 dark:bg-emerald-950 dark:text-emerald-400">
              &#10003; {t("common.reportSubmitted")}
            </span>
          )}
          {!response.error && typeof response.confidence === "number" && (
            <ConfidenceBadge confidence={response.confidence} />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          {typeof response.elapsedMs === "number" && <span>{formatElapsed(response.elapsedMs)}</span>}
          {devMode && (
            <span>
              {response.provider} / {response.model}
            </span>
          )}
        </div>
      </div>
      {response.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{response.error}</p>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {response.response}
        </p>
      )}
    </div>
  );
}
