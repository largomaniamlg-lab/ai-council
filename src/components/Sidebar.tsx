"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Project, Session } from "@/lib/data";

export default function Sidebar({
  projects,
  supabaseConfigured,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  sessions,
  selectedSessionId,
  onSelectSession,
  onNewConsultation,
  open,
  onClose,
}: {
  projects: Project[];
  supabaseConfigured: boolean;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewConsultation: () => void;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      await onCreateProject(newProjectName.trim());
      setNewProjectName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 -translate-x-full flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 md:static md:z-auto md:w-72 md:translate-x-0 ${
        open ? "translate-x-0" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("common.appName")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("common.presidentTag")}</p>
        </div>
        <button
          onClick={onClose}
          aria-label={t("sidebar.closeMenu")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 md:hidden"
        >
          &#10005;
        </button>
      </div>

      {!supabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {t("sidebar.supabaseWarning")}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder={t("sidebar.newProjectPlaceholder")}
          disabled={!supabaseConfigured}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
        />
        <button
          type="submit"
          disabled={!supabaseConfigured || creating}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
        >
          +
        </button>
      </form>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {t("sidebar.projectsLabel")}
      </div>
      <ul className="mb-4 flex flex-col gap-1 overflow-y-auto">
        {projects.length === 0 && (
          <li className="text-sm text-slate-400 dark:text-slate-500">
            {t("sidebar.noProjects")}
          </li>
        )}
        {projects.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onSelectProject(p.id)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedProjectId === p.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      {selectedProjectId && (
        <>
          <button
            onClick={onNewConsultation}
            className="mb-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            {t("sidebar.newConsultation")}
          </button>

          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("sidebar.historyLabel")}
          </div>
          <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {sessions.length === 0 && (
              <li className="text-sm text-slate-400 dark:text-slate-500">
                {t("sidebar.noSessions")}
              </li>
            )}
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelectSession(s.id)}
                  className={`w-full truncate rounded-md px-3 py-2 text-left text-xs ${
                    selectedSessionId === s.id
                      ? "bg-slate-200 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                  title={s.title}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href="/settings"
        className="mt-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700"
      >
        &#9881; {t("sidebar.settingsLink")}
      </Link>
    </aside>
  );
}
