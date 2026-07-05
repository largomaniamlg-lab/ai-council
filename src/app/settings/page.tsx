"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings/SettingsProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { locales, localeNames, type Locale } from "@/lib/i18n";

interface StatusResponse {
  providers: Record<string, boolean>;
  supabase: boolean;
  simulatorModel: string;
  simulator: {
    provider: string;
    modelDisplayName: string;
    plan: string;
    connected: boolean;
  };
}

const SPEED_PRESETS = { fast: 250, normal: 500, slow: 900 } as const;
type SpeedPreset = keyof typeof SPEED_PRESETS;

function speedFromMs(ms: number): SpeedPreset {
  if (ms <= 250) return "fast";
  if (ms >= 900) return "slow";
  return "normal";
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap rounded-md bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
      {options.map((opt) => (
        <button
          key={String(opt.id)}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 rounded px-3 py-1.5 transition-colors ${
            value === opt.id
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { locale, setLocale, theme, setTheme, devMode, setDevMode, revealDelayMs, setRevealDelayMs } =
    useSettings();
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function renderApiStatus(label: string, configured: boolean | undefined) {
    return (
      <div className="flex items-center justify-between py-1.5 text-sm">
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        {configured === undefined ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {t("settings.apiChecking")}
          </span>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              configured
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {configured ? t("settings.apiConfigured") : t("settings.apiNotConfigured")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("settings.title")}
          </h1>
          <Link
            href="/"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
          >
            &larr; {t("settings.backToConsole")}
          </Link>
        </div>

        <SectionCard title={t("settings.languageSection")}>
          <SegmentedControl<Locale>
            value={locale}
            onChange={setLocale}
            options={locales.map((l) => ({ id: l, label: localeNames[l] }))}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("settings.languageHint")}
          </p>
        </SectionCard>

        <SectionCard title={t("settings.themeSection")}>
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { id: "light" as const, label: t("settings.themeLight") },
              { id: "dark" as const, label: t("settings.themeDark") },
            ]}
          />
        </SectionCard>

        <SectionCard title={t("settings.speedSection")}>
          <SegmentedControl<SpeedPreset>
            value={speedFromMs(revealDelayMs)}
            onChange={(id) => setRevealDelayMs(SPEED_PRESETS[id])}
            options={[
              { id: "fast", label: t("settings.speedFast") },
              { id: "normal", label: t("settings.speedNormal") },
              { id: "slow", label: t("settings.speedSlow") },
            ]}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("settings.speedHint")}
          </p>
        </SectionCard>

        <SectionCard title={t("settings.devModeSection")}>
          <SegmentedControl
            value={devMode}
            onChange={setDevMode}
            options={[
              { id: true, label: t("settings.devModeOn") },
              { id: false, label: t("settings.devModeOff") },
            ]}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t("settings.devModeHint")}
          </p>
        </SectionCard>

        <SectionCard title={t("settings.engineSection")}>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            {t("settings.engineHint")}
          </p>
          <div className="divide-y divide-slate-100 rounded-md bg-slate-100 px-3 dark:divide-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {t("settings.engineProvider")}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {status?.simulator.provider === "openrouter" ? "OpenRouter" : (status?.simulator.provider ?? "...")}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {t("settings.engineSimulatorModel")}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {status?.simulator.modelDisplayName ?? "..."}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{t("settings.enginePlan")}</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {status?.simulator.plan ?? "..."}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {t("settings.engineStatus")}
              </span>
              {status ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    status.simulator.connected
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  }`}
                >
                  {status.simulator.connected
                    ? t("settings.statusConnected")
                    : t("settings.statusNotConnected")}
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {t("settings.apiChecking")}
                </span>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t("settings.apiStatusSection")}>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            {t("settings.apiStatusHint")}
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {renderApiStatus("OpenRouter", status?.providers.openrouter)}
            {renderApiStatus("OpenAI", status?.providers.openai)}
            {renderApiStatus("Anthropic", status?.providers.anthropic)}
            {renderApiStatus("Google", status?.providers.google)}
            {renderApiStatus("xAI", status?.providers.xai)}
            {renderApiStatus("Supabase", status?.supabase)}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
