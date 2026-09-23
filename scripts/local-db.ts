/**
 * Local development PostgreSQL without installing anything.
 * Starts an embedded PostgreSQL server on port 5433 with data in ./.local-db.
 * Keep this running in a separate terminal while you develop.
 *
 * Production uses any regular PostgreSQL via DATABASE_URL.
 */
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), ".local-db", "data");
const port = Number(process.env.LOCAL_DB_PORT ?? 5433);

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "asiashop",
    password: "asiashop",
    port,
    persistent: true,
    // UTF-8 regardless of the OS locale (Windows defaults to WIN1251 etc.)
    initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
  });

  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Initialising local PostgreSQL cluster…");
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase("asiashop");
    console.log("Created database 'asiashop'.");
  } catch {
    // already exists
  }

  console.log(`\nPostgreSQL is running on port ${port}.`);
  console.log(`DATABASE_URL="postgresql://asiashop:asiashop@localhost:${port}/asiashop?schema=public"`);
  console.log("Press Ctrl+C to stop.\n");

  const stop = async () => {
    console.log("\nStopping PostgreSQL…");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  // keep the process alive
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
