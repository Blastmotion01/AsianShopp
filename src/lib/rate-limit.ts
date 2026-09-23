import "server-only";
import { headers } from "next/headers";
import { AppError } from "./errors";

/**
 * Simple fixed-window in-memory rate limiter.
 * Per-instance only — swap for Redis/Upstash when running multiple instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function enforceRateLimit(action: string, limit: number, windowMs: number) {
  const ip = await clientIp();
  if (!checkRateLimit(`${action}:${ip}`, limit, windowMs)) {
    throw new AppError("rate_limited", 429);
  }
}
