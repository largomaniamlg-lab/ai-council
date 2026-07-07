"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { locales, localeNames } from "@/lib/i18n";
import { listLocalSessions, getLocalSession, deleteLocalSession, type LocalSession } from "@/lib/localHistory";
import type { CouncilMode } from "@/config/councilRoles";

type HistoryStatus = "in_progress" | "completed" | "decision_saved";

interface HistoryRow {
  id: string;
  source: "supabase" | "local";
  projectId: string | null;
  projectName: string | null;
  title: string;
  problem: string;
  mode: CouncilMode;
  locale: string | null;
  rounds: number;
  finalRecommendation: string;
  status: HistoryStatus;
  createdAt: string;
}

function localToRow(s: LocalSession): HistoryRow {
  const latest = s.minutesHistory[s.minutesHistory.length - 1];
  return {
    id: s.id,
    source: "local",
    projectId: null,
    projectName: null,
    title: s.title,
    problem: s.problem,
    mode: s.mode,
    locale: s.locale,
    rounds: latest?.round ?? 0,
    finalRecommendation: latest?.recommendation ?? "",
    status: s.decision ? "decision_saved" : latest ? "completed" : "in_progress",
    createdAt: s.createdAt,
  };
}

export default function HistoryPage() {
  const { t, tMode } = useTranslation();
  const router = useRouter();
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(null);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState<CouncilMode | "all">("all");
  const [localeFilter, setLocaleFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSupabaseConfigured(Boolean(data.supabase));
      })
      .catch(() => {
        if (!cancelled) setSupabaseConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (supabaseConfigured === null) return;

    async function loadRows() {
      if (supabaseConfigured) {
        try {
          const res = await fetch("/api/history");
          const data = await res.json();
          const fetched = (data.sessions ?? []) as Omit<HistoryRow, "source">[];
          setRows(fetched.map((s) => ({ ...s, source: "supabase" as const })));
        } catch {
          setRows([]);
        }
      } else {
        setRows(listLocalSessions().map(localToRow));
      }
    }

    loadRows();
  }, [supabaseConfigured]);

  const projects = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.projectId) map.set(r.projectId, r.projectName ?? r.projectId);
    });
    return Array.from(map.entries());
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (projectFilter !== "all" && r.projectId !== projectFilter) return false;
    if (modeFilter !== "all" && r.mode !== modeFilter) return false;
    if (localeFilter !== "all" && r.locale !== localeFilter) return false;
    if (search.trim() && !`${r.title} ${r.problem}`.toLowerCase().includes(search.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  function handleOpen(row: HistoryRow) {
    router.push(`/?openSession=${row.id}`);
  }

  async function handleDelete(row: HistoryRow) {
    if (!window.confirm(t("history.deleteConfirm"))) return;
    if (row.source === "supabase") {
      await fetch(`/api/history/${row.id}`, { method: "DELETE" });
    } else {
      deleteLocalSession(row.id);
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  async function handleExport(row: HistoryRow) {
    let markdown = "";
    if (row.source === "supabase") {
      const res = await fetch(`/api/sessions/${row.id}`);
      const data = await res.json();
      markdown = (data.minutesHistory ?? [])
        .map((m: { markdown: string }) => m.markdown)
        .join("\n\n---\n\n");
    } else {
      const full = getLocalSession(row.id);
      markdown = (full?.minutesHistory ?? []).map((m) => m.markdown).join("\n\n---\n\n");
    }
    const blob = new Blob([markdown || "_Sin contenido_"], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.title.slice(0, 40).replace(/[^a-z0-9]+/gi, "-") || "session"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function statusBadge(status: HistoryStatus) {
    const label =
      status === "decision_saved"
        ? t("history.statusDecisionSaved")
        : status === "completed"
          ? t("history.statusCompleted")
          : t("history.statusInProgress");
    const style =
      status === "decision_saved"
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        : status === "completed"
          ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{label}</span>;
  }

  const selectClass =
    "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("history.title")}</h1>
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
          >
            &larr; {t("history.backToConsole")}
          </Link>
        </div>

        {supabaseConfigured === false && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {t("history.noSupabaseHint")}
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("history.searchPlaceholder")}
            className="mb-3 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex flex-wrap gap-2">
            {projects.length > 0 && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">{t("history.allProjects")}</option>
                {projects.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as CouncilMode | "all")}
              className={selectClass}
            >
              <option value="all">{t("history.allModes")}</option>
              <option value="rapido">{tMode("rapido").label}</option>
              <option value="completo">{tMode("completo").label}</option>
              <option value="debate">{tMode("debate").label}</option>
              <option value="experto">{tMode("experto").label}</option>
            </select>
            <select
              value={localeFilter}
              onChange={(e) => setLocaleFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">{t("history.allLocales")}</option>
              {locales.map((l) => (
                <option key={l} value={l}>
                  {localeNames[l]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">{t("history.noSessions")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">{row.title}</h2>
                  {statusBadge(row.status)}
                </div>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                  {new Date(row.createdAt).toLocaleString()} &middot; {tMode(row.mode).label}
                  {row.locale ? ` · ${localeNames[row.locale as keyof typeof localeNames] ?? row.locale}` : ""}
                  {row.projectName ? ` · ${row.projectName}` : ""} &middot; {row.rounds}{" "}
                  {t("history.roundsLabel")}
                </p>
                <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                  {row.finalRecommendation || t("history.noRecommendationYet")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleOpen(row)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    {t("history.openButton")}
                  </button>
                  <button
                    onClick={() => handleExport(row)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500"
                  >
                    {t("history.exportButton")}
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:border-red-700"
                  >
                    {t("history.deleteButton")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
