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
// On Vercel, ignore empty values and leftovers from .env.example that point at a local database.
const isUsable = (v) => !!v && /^postgres(ql)?:\/\//.test(v.trim()) && !(env.VERCEL && /localhost|127\.0\.0\.1/.test(v));
const keys = Object.keys(env).filter((k) => isUsable(env[k]));
// Custom prefixes chosen when connecting the DB (e.g. "STORAGE" → STORAGE_URL, STORAGE_POSTGRES_HOST).
const prefixes = Object.keys(env)
  .map((k) => /^(.+)_(POSTGRES_HOST|PGHOST)$/.exec(k)?.[1])
  .filter(Boolean);

/** Finds a variable by exact name, then by suffix (custom prefixes), then prefix-only names like STORAGE_URL. */
function find(suffixes, prefixForms) {
  for (const s of suffixes) if (keys.includes(s)) return s;
  for (const s of suffixes) {
    const hit = keys.find((k) => k.endsWith(`_${s}`));
    if (hit) return hit;
  }
  for (const p of prefixes) for (const f of prefixForms) if (keys.includes(`${p}_${f}`)) return `${p}_${f}`;
  return undefined;
}

const pooledName = find(["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"], ["URL"]);
const directName = find(["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL"], ["URL_UNPOOLED", "URL"]);

if (!pooledName) {
  const seen = Object.keys(env).filter((k) => /DATABASE|POSTGRES|PG|NEON/i.test(k));
  console.error("\n✖ No database URL found.");
  console.error("  Connect a database to this Vercel project (Storage → Neon → Connect), then Redeploy.");
  console.error("  Database-related variables visible to the build:");
  for (const k of seen) console.error(`    - ${k}${isUsable(env[k]) ? "" : "  (empty or points to localhost — ignored)"}`);
  if (!seen.length) console.error("    (none)");
  console.error("");
  process.exit(1);
}

env.DATABASE_URL = env[pooledName];
env.DATABASE_URL_UNPOOLED = env[directName];
console.log(`✓ Database: using ${pooledName} (app) and ${directName} (migrations)`);

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
run("npx prisma generate");
run("npx prisma migrate deploy");

// Fail fast with a clear message if the app's (pooled) connection doesn't work,
// instead of the site failing later at runtime. Bounded by a timeout.
try {
  execSync(`npx prisma db execute --stdin --url ${JSON.stringify(env.DATABASE_URL)}`, {
    input: "SELECT 1;",
    stdio: ["pipe", "inherit", "inherit"],
    env,
    timeout: 60_000,
  });
  console.log(`✓ Database connection OK via ${pooledName}`);
} catch (err) {
  console.error(`\n✖ Could not connect to the database via ${pooledName} (${err.code === "ETIMEDOUT" ? "timed out after 60s" : "connection error, see above"}).`);
  console.error("  Check the Neon database status and that it is connected to this project, then redeploy.\n");
  process.exit(1);
}

// The build itself does not touch the database: pages are rendered on first request and cached.
run("npx next build");
