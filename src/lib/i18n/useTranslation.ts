"use client";

import { useSettings } from "@/lib/settings/SettingsProvider";
import { dictionaries, type Dictionary } from "@/lib/i18n";
import type { ModeTranslation, RoleTranslation } from "@/lib/i18n/types";

type LeafSection =
  | "meta"
  | "common"
  | "header"
  | "sidebar"
  | "form"
  | "acta"
  | "settings"
  | "errors"
  | "discovery"
  | "history";

function getPath(dict: Dictionary, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

export function useTranslation() {
  const { locale } = useSettings();
  const dict = dictionaries[locale];

  function t(path: `${LeafSection}.${string}`): string {
    const value = getPath(dict, path);
    return typeof value === "string" ? value : path;
  }

  function tRole(roleId: string): RoleTranslation | undefined {
    return dict.roles[roleId];
  }

  function tMode(modeId: keyof Dictionary["modes"]): ModeTranslation {
    return dict.modes[modeId];
  }

  return { t, tRole, tMode, locale, dict };
}
