"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultLocale, isSupportedLocale, type Locale } from "@/lib/i18n";

export type Theme = "light" | "dark";

interface AppSettings {
  locale: Locale;
  theme: Theme;
  devMode: boolean;
  revealDelayMs: number;
  // v0.5.3 Mock AI: cuando esta activo, ninguna llamada llega a un
  // proveedor externo (Discovery, especialistas, Moderador, Challenge usan
  // las plantillas locales). Solo tiene efecto visible con Developer Mode.
  mockAI: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  locale: defaultLocale,
  theme: "light",
  devMode: false,
  revealDelayMs: 500,
  mockAI: false,
};

const STORAGE_KEY = "ai-council-settings";

interface SettingsContextValue extends AppSettings {
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  setDevMode: (value: boolean) => void;
  setRevealDelayMs: (ms: number) => void;
  setMockAI: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Carga la preferencia guardada (o detecta el idioma del navegador la
  // primera vez) despues de montar, para evitar diferencias entre el HTML
  // renderizado en el servidor y el del cliente.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialSettings() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          if (!cancelled) setSettings((prev) => ({ ...prev, ...parsed }));
        } else {
          const browserLang = window.navigator.language?.slice(0, 2);
          if (browserLang && isSupportedLocale(browserLang) && !cancelled) {
            setSettings((prev) => ({ ...prev, locale: browserLang }));
          }
        }
      } catch {
        // localStorage no disponible: seguimos con los valores por defecto.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    loadInitialSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // almacenamiento lleno o bloqueado: no es critico, seguimos en memoria.
    }
  }, [settings, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  const value: SettingsContextValue = {
    ...settings,
    setLocale: (locale) => setSettings((s) => ({ ...s, locale })),
    setTheme: (theme) => setSettings((s) => ({ ...s, theme })),
    setDevMode: (devMode) => setSettings((s) => ({ ...s, devMode })),
    setRevealDelayMs: (revealDelayMs) => setSettings((s) => ({ ...s, revealDelayMs })),
    setMockAI: (mockAI) => setSettings((s) => ({ ...s, mockAI })),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings debe usarse dentro de <SettingsProvider>");
  }
  return ctx;
}
