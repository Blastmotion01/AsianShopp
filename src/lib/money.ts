import { intlLocale, type Locale } from "@/config/site";

/** Formats minor units (kopiykas) as "129 ₴" / "129,50 ₴". */
export function formatPrice(minor: number, locale: Locale = "uk") {
  const value = minor / 100;
  const hasFraction = minor % 100 !== 0;
  const num = new Intl.NumberFormat(intlLocale[locale], {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${num} ₴`;
}

/** Parses a user-entered UAH amount ("129.5" / "129,50") into minor units. */
export function toMinor(uah: number | string) {
  const n = typeof uah === "string" ? Number(uah.replace(",", ".").replace(/\s/g, "")) : uah;
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

export function toMajor(minor: number) {
  return minor / 100;
}
