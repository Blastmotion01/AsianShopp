import { defaultLocale, locales, type Locale } from "@/config/site";
import { z } from "zod";

export type Localized = Partial<Record<Locale, string>>;

/** Picks the value for `locale`, falling back to uk → en → first non-empty. */
export function pickLocalized(value: unknown, locale: Locale): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const v = value as Record<string, unknown>;
  const order: string[] = [locale, defaultLocale, "en", ...locales];
  for (const key of order) {
    const s = v[key];
    if (typeof s === "string" && s.trim()) return s;
  }
  return "";
}

export const localizedSchema = z.object({
  uk: z.string().trim().min(1).max(500),
  ru: z.string().trim().max(500).optional().default(""),
  en: z.string().trim().max(500).optional().default(""),
});

export const localizedLongSchema = z.object({
  uk: z.string().trim().max(5000).optional().default(""),
  ru: z.string().trim().max(5000).optional().default(""),
  en: z.string().trim().max(5000).optional().default(""),
});

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
