import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Accepts the URL under the names different hosting DB integrations use
 * (Neon, Vercel Postgres), including custom prefixes like STORAGE_DATABASE_URL.
 */
function resolveDatabaseUrl() {
  const env = process.env;
  for (const name of ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"]) {
    if (env[name]) return env[name];
    const prefixed = Object.keys(env).find((k) => k.endsWith(`_${name}`) && env[k]);
    if (prefixed) return env[prefixed];
  }
  return undefined;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
