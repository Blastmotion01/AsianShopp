/**
 * Processes a product photo the same way the admin upload does (src/lib/images/stylize.ts)
 * and saves it next to the site's shipped photos.
 *
 *   npx tsx scripts/stylize-photo.ts <input> <slug> <KR|JP|CN|US|MIX> [--hull|--box|--plain]
 *   → public/product-photos/<slug>.webp  (800×800)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { stylizeProductPhoto, type StylizeMode } from "../src/lib/images/stylize";

const [input, slug, country = "MIX", ...flags] = process.argv.slice(2);
if (!input || !slug) {
  console.error("usage: npx tsx scripts/stylize-photo.ts <input> <slug> <KR|JP|CN|US|MIX> [--hull|--box|--plain]");
  process.exit(1);
}
const mode: StylizeMode = flags.includes("--hull") ? "hull" : flags.includes("--box") ? "box" : flags.includes("--plain") ? "plain" : "auto";

async function main() {
  const res = await stylizeProductPhoto(await fs.readFile(input), { country, mode });
  if (!res) throw new Error("no plain light background found — photograph the product on a white/grey background");
  const out = path.resolve("public/product-photos", `${slug}.webp`);
  await fs.writeFile(out, res.image);
  console.log(`✓ ${slug}: background removed ${(res.removed * 100).toFixed(0)}%, mode ${res.mode} → ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
