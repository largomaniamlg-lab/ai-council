"use client";

import type { CouncilMode } from "@/config/councilRoles";
import { useTranslation } from "@/lib/i18n/useTranslation";

const MODE_IDS: CouncilMode[] = ["rapido", "completo", "debate", "experto"];

export default function ModeSelector({
  mode,
  onChange,
}: {
  mode: CouncilMode;
  onChange: (mode: CouncilMode) => void;
}) {
  const { tMode } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {MODE_IDS.map((id) => {
        const m = tMode(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={m.description}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              mode === id
                ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
            }`}
          >
            <div className="font-medium">{m.label}</div>
            <div
              className={`mt-0.5 text-xs ${
                mode === id
                  ? "text-slate-300 dark:text-slate-600"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {m.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
