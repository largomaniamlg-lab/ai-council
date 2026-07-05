"use client";

import { getRoleById } from "@/config/councilRoles";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSettings } from "@/lib/settings/SettingsProvider";
import type { AgentResponse } from "@/lib/types";

export default function SpecialistCard({ response }: { response: AgentResponse }) {
  const role = getRoleById(response.roleId);
  const color = role?.color ?? "#334155";
  const { t, tRole } = useTranslation();
  const { devMode } = useSettings();
  const displayName = (role && tRole(role.id)?.name) ?? response.roleName;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-semibold text-slate-800 dark:text-slate-100">{displayName}</span>
          {response.round > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              {t("common.roundLabel")} {response.round}
            </span>
          )}
        </div>
        {devMode && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {response.provider} / {response.model}
          </span>
        )}
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
