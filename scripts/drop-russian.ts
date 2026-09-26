/**
 * One-off cleanup after the Russian version was removed: deletes Russian product
 * translations, strips the "ru" key from localized JSON fields and switches stored
 * locale preferences from ru to uk.
 *   npx tsx scripts/drop-russian.ts            → uses DATABASE_URL
 * Safe to re-run.
 */
import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Removes "ru" from every { uk, ru, en }-like object, at any depth. */
function strip(value: unknown): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => {
      const r = strip(v);
      changed ||= r.changed;
      return r.value;
    });
    return { value: out, changed };
  }
  if (value && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    const obj = value as Record<string, unknown>;
    const localized = "ru" in obj && ("uk" in obj || "en" in obj);
    for (const [k, v] of Object.entries(obj)) {
      if (localized && k === "ru") {
        changed = true;
        continue;
      }
      const r = strip(v);
      changed ||= r.changed;
      out[k] = r.value;
    }
    return { value: out, changed };
  }
  return { value, changed: false };
}

const json = (v: unknown) => v as Prisma.InputJsonValue;
const optJson = (v: unknown) => (v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue));

async function main() {
  const tr = await db.productTranslation.deleteMany({ where: { locale: "ru" } });
  console.log(`product translations (ru) deleted: ${tr.count}`);

  let n = 0;
  for (const c of await db.country.findMany()) {
    const a = strip(c.name), b = strip(c.tagline);
    if (a.changed || b.changed) {
      await db.country.update({ where: { id: c.id }, data: { name: json(a.value), tagline: optJson(b.value) } });
      n++;
    }
  }
  for (const c of await db.category.findMany()) {
    const a = strip(c.name), b = strip(c.description);
    if (a.changed || b.changed) {
      await db.category.update({ where: { id: c.id }, data: { name: json(a.value), description: optJson(b.value) } });
      n++;
    }
  }
  for (const p of await db.product.findMany({ select: { id: true, seoTitle: true, seoDescription: true } })) {
    const a = strip(p.seoTitle), b = strip(p.seoDescription);
    if (a.changed || b.changed) {
      await db.product.update({ where: { id: p.id }, data: { seoTitle: optJson(a.value), seoDescription: optJson(b.value) } });
      n++;
    }
  }
  for (const v of await db.productVariant.findMany({ select: { id: true, name: true } })) {
    const a = strip(v.name);
    if (a.changed) {
      await db.productVariant.update({ where: { id: v.id }, data: { name: json(a.value) } });
      n++;
    }
  }
  for (const b of await db.contentBlock.findMany()) {
    const a = strip(b.data);
    if (a.changed) {
      await db.contentBlock.update({ where: { id: b.id }, data: { data: json(a.value) } });
      n++;
    }
  }
  console.log(`rows with ru text stripped: ${n}`);

  const users = await db.user.updateMany({ where: { locale: "ru" }, data: { locale: "uk" } });
  const orders = await db.order.updateMany({ where: { locale: "ru" }, data: { locale: "uk" } });
  const reviews = await db.review.count({ where: { locale: "ru" } });
  console.log(`users → uk: ${users.count}, orders → uk: ${orders.count}, reviews marked ru: ${reviews}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
