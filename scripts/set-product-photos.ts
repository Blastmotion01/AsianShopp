/**
 * Points products at photos shipped in public/product-photos/<slug>.webp.
 * Replaces the generated placeholder (only) — photos uploaded in the admin are kept.
 *   npx tsx scripts/set-product-photos.ts            → uses DATABASE_URL
 * Safe to re-run.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const dir = path.resolve(process.cwd(), "public/product-photos");

async function main() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".webp"));
  for (const file of files) {
    const slug = file.replace(/\.webp$/, "");
    const product = await db.product.findUnique({ where: { slug }, include: { images: { orderBy: { sortOrder: "asc" } }, translations: { where: { locale: "uk" } } } });
    if (!product) {
      console.log(`- ${slug}: product not found, skipped`);
      continue;
    }
    const url = `/product-photos/${file}`;
    if (product.images.some((i) => i.url === url)) {
      console.log(`= ${slug}: already set`);
      continue;
    }
    const alt = product.translations[0]?.name ?? slug;
    await db.$transaction([
      // drop only the generated placeholder, keep any real uploads
      db.productImage.deleteMany({ where: { productId: product.id, url: { startsWith: "/placeholders/" } } }),
      db.productImage.updateMany({ where: { productId: product.id }, data: { sortOrder: { increment: 1 } } }),
      db.productImage.create({ data: { productId: product.id, url, alt, sortOrder: 0 } }),
    ]);
    console.log(`✓ ${slug}: ${url}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
