/**
 * Build entry for Vercel (`npm run vercel-build`).
 * Resolves the database URLs from whatever names the DB integration provided
 * (Neon: DATABASE_URL / DATABASE_URL_UNPOOLED, Vercel Postgres style: POSTGRES_*,
 * optionally with a custom prefix such as STORAGE_DATABASE_URL),
 * then runs: prisma generate → prisma migrate deploy → next build.
 * Only variable NAMES are logged, never values.
 */
import { execSync } from "node:child_process";

// Local runs: load .env if present (never overrides variables already set by Vercel).
try {
  process.loadEnvFile(".env");
} catch {
  /* no .env on Vercel — variables come from the project settings */
}

const env = process.env;
const keys = Object.keys(env).filter((k) => env[k] && env[k].trim() !== "");

/** Finds a variable by exact name first, then by suffix (to support custom prefixes). */
function find(...suffixes) {
  for (const s of suffixes) if (keys.includes(s)) return s;
  for (const s of suffixes) {
    const hit = keys.find((k) => k.endsWith(`_${s}`));
    if (hit) return hit;
  }
  return undefined;
}

const pooledName = find("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
const directName = find("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL");

if (!pooledName) {
  const seen = Object.keys(env).filter((k) => /DATABASE|POSTGRES|PG|NEON/i.test(k));
  console.error("\n✖ No database URL found.");
  console.error("  Connect a database to this Vercel project (Storage → Neon → Connect), then Redeploy.");
  console.error(`  Database-related variables visible to the build: ${seen.length ? seen.join(", ") : "none"}\n`);
  process.exit(1);
}

env.DATABASE_URL = env[pooledName];
env.DATABASE_URL_UNPOOLED = env[directName];
console.log(`✓ Database: using ${pooledName} (app) and ${directName} (migrations)`);

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx next build");
