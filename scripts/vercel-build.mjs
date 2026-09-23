/**
 * Build entry for Vercel (`npm run vercel-build`).
 * Resolves the database URLs from whatever names the DB integration provided
 * (Neon: DATABASE_URL / DATABASE_URL_UNPOOLED, Vercel Postgres style: POSTGRES_*),
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
const first = (...names) => names.find((n) => env[n] && env[n].trim() !== "");

const pooledName = first("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
const directName = first("DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL");

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
