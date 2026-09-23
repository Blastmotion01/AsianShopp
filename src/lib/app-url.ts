/**
 * Public origin of the site, e.g. "https://asiashop.ua".
 * Tolerant on purpose: accepts NEXT_PUBLIC_APP_URL with or without "https://",
 * falls back to the URL Vercel provides, and never throws (a bad value must not
 * take the whole site down).
 */
export function getAppUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "http://localhost:3000";
}
