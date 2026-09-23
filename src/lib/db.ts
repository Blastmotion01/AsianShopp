import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Accepts the URL under the names different hosting DB integrations use
 * (Neon, Vercel Postgres), including custom prefixes like STORAGE_DATABASE_URL.
 */
function resolveDatabaseUrl() {
  const env = process.env;
  // On Vercel, ignore empty values and .env.example leftovers pointing at a local database.
  const usable = (v: string | undefined): v is string =>
    !!v && /^postgres(ql)?:\/\//.test(v.trim()) && !(env.VERCEL && /localhost|127\.0\.0\.1/.test(v));
  for (const name of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) {
    if (usable(env[name])) return env[name];
    const prefixed = Object.keys(env).find((k) => k.endsWith(`_${name}`) && usable(env[k]));
    if (prefixed) return env[prefixed];
  }
  // Custom prefix without "DATABASE" (e.g. STORAGE_URL next to STORAGE_POSTGRES_HOST)
  for (const k of Object.keys(env)) {
    const prefix = /^(.+)_(POSTGRES_HOST|PGHOST)$/.exec(k)?.[1];
    if (prefix && usable(env[`${prefix}_URL`])) return env[`${prefix}_URL`];
  }
  return undefined;
}

const resolvedUrl = resolveDatabaseUrl();
// The schema references DATABASE_URL / DATABASE_URL_UNPOOLED by name. With prefixed
// integration variables (STORAGE_*) those may be absent or empty at runtime, so point
// them at the resolved URL — Prisma must never fail just because of variable naming.
if (resolvedUrl) {
  if (!process.env.DATABASE_URL?.trim() || (process.env.VERCEL && /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL))) {
    process.env.DATABASE_URL = resolvedUrl;
  }
  if (!process.env.DATABASE_URL_UNPOOLED?.trim()) process.env.DATABASE_URL_UNPOOLED = resolvedUrl;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolvedUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
