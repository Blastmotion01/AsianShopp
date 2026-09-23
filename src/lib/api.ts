import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { AppError } from "./errors";
import { isLocale } from "./localized";
import { defaultLocale, type Locale } from "@/config/site";
import { checkRateLimit } from "./rate-limit";

export function apiError(code: string, status = 400, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: code, meta }, { status });
}

/** Wraps a route handler: maps AppError to JSON, hides unexpected errors. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) return apiError(err.code, err.status, err.meta);
      console.error("[api error]", err);
      return apiError("server_error", 500);
    }
  };
}

export function localeFrom(req: Request): Locale {
  const l = new URL(req.url).searchParams.get("locale");
  return isLocale(l) ? l : defaultLocale;
}

/**
 * CSRF defence for cookie-authenticated JSON mutations: require JSON content type
 * and a same-origin Origin header (SameSite=Lax cookies are the second layer).
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin && host && new URL(origin).host !== host) throw new AppError("forbidden", 403);
  const ct = req.headers.get("content-type") ?? "";
  if (req.method !== "GET" && req.method !== "DELETE" && !ct.includes("application/json")) {
    throw new AppError("validation", 415);
  }
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("validation", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("validation", 400);
  return parsed.data;
}

export function rateLimitRequest(req: Request, action: string, limit: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!checkRateLimit(`${action}:${ip}`, limit, windowMs)) throw new AppError("rate_limited", 429);
}
