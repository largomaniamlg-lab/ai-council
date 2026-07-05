import { en } from "./en";
import { es } from "./es";
import { nb } from "./nb";
import type { Dictionary } from "./types";

export type Locale = "en" | "es" | "nb";

export const locales: Locale[] = ["en", "es", "nb"];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Espanol",
  nb: "Norsk Bokmal",
};

export function isSupportedLocale(value: string): value is Locale {
  return (locales as string[]).includes(value);
}

export const dictionaries: Record<Locale, Dictionary> = { en, es, nb };

export type { Dictionary } from "./types";
