/**
 * Seed script: `npm run db:seed` (runs automatically after `prisma migrate reset`).
 * Creates roles, the admin user (from ADMIN_EMAIL / ADMIN_PASSWORD), catalog,
 * illustrated placeholder images, promo codes, CMS blocks and demo orders.
 * Safe to re-run: existing rows are kept (upserts / skip-if-exists).
 */
import { PrismaClient, type OrderStatus, type DeliveryMethod, type PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { countries, categories, products, reviews, REVIEWER_LOCALE } from "./seed-data";
import { DEFAULT_ROLE_PERMISSIONS } from "../src/lib/auth/permissions";
import { DEFAULT_BLOCK_DATA, DEFAULT_SETTINGS, HOME_BLOCKS } from "../src/features/cms/blocks";

const db = new PrismaClient();
const uah = (v: number) => Math.round(v * 100);

function slugifyBrand(name: string) {
  return name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Deterministic pseudo-random so demo data is stable between runs
let seedState = 42;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

async function seedRoles() {
  for (const [key, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const name = key.charAt(0) + key.slice(1).toLowerCase().replace("_", " ");
    await db.role.upsert({ where: { key }, update: {}, create: { key, name, permissions } });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("⚠ ADMIN_EMAIL / ADMIN_PASSWORD not set — admin user not created. Run `npm run admin:create` later.");
    return;
  }
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  const role = await db.role.findUniqueOrThrow({ where: { key: "ADMIN" } });
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { roleId: role.id } });
    console.log(`✓ Admin ${email} exists (role ensured, password unchanged)`);
    return;
  }
  await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      firstName: process.env.ADMIN_NAME || "Admin",
      roleId: role.id,
    },
  });
  console.log(`✓ Admin ${email} created`);
}

async function seedDemoCustomers() {
  const role = await db.role.findUniqueOrThrow({ where: { key: "CUSTOMER" } });
  const people = [
    { email: "olena.demo@example.com", firstName: "Олена", lastName: "Коваль", phone: "+380671112233" },
    { email: "dmytro.demo@example.com", firstName: "Дмитро", lastName: "Шевчук", phone: "+380502223344" },
    { email: "iryna.demo@example.com", firstName: "Ірина", lastName: "Бондар", phone: "+380633334455" },
    { email: "max.demo@example.com", firstName: "Max", lastName: "Petrenko", phone: "+380974445566" },
  ];
  const users = [];
  for (const p of people) {
    // Demo customers get a random password nobody knows — they can't log in.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    users.push(await db.user.upsert({ where: { email: p.email }, update: {}, create: { ...p, passwordHash, roleId: role.id } }));
  }
  return users;
}

async function seedCatalog() {
  for (const [i, c] of countries.entries()) {
    await db.country.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, slug: c.slug, flag: c.flag, accentColor: c.accentColor, name: c.name, tagline: c.tagline, sortOrder: i },
    });
  }
  for (const [i, c] of categories.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { slug: c.slug, emoji: c.emoji, color: c.color, name: c.name, description: c.description, sortOrder: i, showOnHome: c.showOnHome ?? true },
    });
  }

  const countryByCode = Object.fromEntries((await db.country.findMany()).map((c) => [c.code, c]));
  const categoryBySlug = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c]));

  let created = 0;
  for (const [idx, p] of products.entries()) {
    if (await db.product.findUnique({ where: { slug: p.slug } })) continue;

    const brandSlug = slugifyBrand(p.brand);
    const brand = await db.brand.upsert({
      where: { slug: brandSlug },
      update: {},
      create: { slug: brandSlug, name: p.brand, countryId: p.country ? countryByCode[p.country].id : null },
    });

    const variants = p.variants ?? [
      { suffix: "1", name: { uk: "1 шт", ru: "1 шт", en: "Single" }, price: p.price, compareAt: p.compareAt, weight: p.weight, stock: p.stock },
    ];

    await db.product.create({
      data: {
        slug: p.slug,
        price: uah(Math.min(...variants.map((v) => v.price))),
        compareAtPrice: p.compareAt ? uah(p.compareAt) : null,
        weightGrams: p.weight ?? null,
        volumeMl: p.volume ?? null,
        spiceLevel: p.spice ?? 0,
        nutrition: p.nutrition ?? undefined,
        isNew: !!p.isNew,
        isPopular: !!p.isPopular,
        isFeatured: !!p.isFeatured,
        isLimited: !!p.isLimited,
        tags: p.tags,
        brandId: brand.id,
        countryId: p.country ? countryByCode[p.country].id : null,
        categoryId: categoryBySlug[p.category].id,
        // Stagger createdAt so "Newest" sorting is meaningful
        createdAt: new Date(Date.now() - (products.length - idx) * 36e5 * (p.isNew ? 1 : 24)),
        translations: {
          create: (["uk", "ru", "en"] as const).map((locale) => ({
            locale,
            name: p.name[locale],
            shortDescription: p.short[locale],
            description: p.desc[locale],
            ingredients: p.ingredients?.[locale] ?? null,
            allergens: p.allergens?.[locale] ?? null,
          })),
        },
        // Illustrated placeholder generated by /placeholders/[slug].svg (not a photo) — replace via admin.
        images: { create: [{ url: `/placeholders/${p.slug}.svg`, alt: p.name.en, sortOrder: 0 }] },
        variants: {
          create: variants.map((v, i) => ({
            sku: `AS-${p.slug.toUpperCase().slice(0, 24)}-${v.suffix}`,
            name: v.name,
            price: uah(v.price),
            compareAtPrice: v.compareAt ? uah(v.compareAt) : null,
            weightGrams: v.weight ?? null,
            isDefault: i === 0,
            sortOrder: i,
            inventory: { create: { quantity: v.stock, lowStockThreshold: 5 } },
          })),
        },
      },
    });
    created++;
  }
  console.log(`✓ Catalog: ${created} products created (${products.length} total in seed)`);
}

/**
 * Product-specific demo reviews. Only reviews written by the demo accounts are replaced,
 * so re-running the seed never touches real customer reviews.
 */
async function seedReviews(users: { id: string }[]) {
  await db.review.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  let created = 0;
  for (const [slug, list] of Object.entries(reviews)) {
    const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) continue;
    for (const r of list) {
      await db.review.create({
        data: {
          productId: product.id,
          userId: users[r.by].id,
          rating: r.rating,
          body: r.body,
          locale: REVIEWER_LOCALE[r.by],
          createdAt: new Date(Date.now() - r.daysAgo * 864e5),
        },
      });
      created++;
    }
  }
  // Recompute rating aggregates for every product
  for (const product of await db.product.findMany({ select: { id: true } })) {
    const agg = await db.review.aggregate({ where: { productId: product.id, isPublished: true }, _avg: { rating: true }, _count: true });
    await db.product.update({
      where: { id: product.id },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count },
    });
  }
  console.log(`✓ Reviews: ${created}`);
}

async function seedPromoCodes() {
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 864e5);
  const codes = [
    { code: "WELCOME10", type: "PERCENTAGE" as const, value: 10, minOrder: uah(300), description: "Welcome discount" },
    { code: "DNIPRO50", type: "FIXED" as const, value: uah(50), minOrder: uah(500), description: "Dnipro locals" },
    { code: "SPICY15", type: "PERCENTAGE" as const, value: 15, minOrder: null, usageLimit: 100, endsAt: inDays(60), description: "Spicy week" },
  ];
  for (const c of codes) {
    await db.promoCode.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  console.log("✓ Promo codes: WELCOME10, DNIPRO50, SPICY15");
}

async function seedCms() {
  for (const [i, b] of HOME_BLOCKS.entries()) {
    await db.contentBlock.upsert({
      where: { key: b.key },
      update: {},
      create: { key: b.key, type: b.type, data: DEFAULT_BLOCK_DATA[b.key] as object, sortOrder: i, isActive: true },
    });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("✓ CMS blocks & settings");
}

async function seedDemoOrders(users: { id: string; email: string; firstName: string; lastName: string | null; phone: string | null }[]) {
  if ((await db.order.count()) > 0) return;
  const variants = await db.productVariant.findMany({
    include: { product: { include: { translations: { where: { locale: "uk" } }, images: { take: 1 } } } },
  });
  const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "CONFIRMED", "NEW", "CANCELLED"];
  const deliveries: DeliveryMethod[] = ["NOVA_POSHTA_BRANCH", "NOVA_POSHTA_BRANCH", "COURIER_DNIPRO", "PICKUP_DNIPRO"];
  const payments: PaymentMethod[] = ["CASH_ON_DELIVERY", "CARD_ONLINE"];
  const cities = ["Дніпро", "Дніпро", "Київ", "Львів", "Харків", "Одеса"];

  for (let i = 0; i < 48; i++) {
    const user = pick(users);
    const lineCount = 1 + Math.floor(rand() * 4);
    const lines = [...variants].sort(() => rand() - 0.5).slice(0, lineCount).map((v) => {
      const quantity = 1 + Math.floor(rand() * 3);
      return { v, quantity, total: v.price * quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const deliveryMethod = pick(deliveries);
    const deliveryFee = deliveryMethod === "PICKUP_DNIPRO" || subtotal >= 100000 ? 0 : 8000;
    const status = pick(statuses);
    const paymentMethod = pick(payments);
    const createdAt = new Date(Date.now() - Math.floor(rand() * 60) * 864e5 - Math.floor(rand() * 864e5));
    const city = deliveryMethod === "NOVA_POSHTA_BRANCH" ? pick(cities) : "Дніпро";

    await db.order.create({
      data: {
        userId: user.id,
        status,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName ?? "",
        phone: user.phone ?? "+380000000000",
        city,
        deliveryMethod,
        deliveryBranch: deliveryMethod === "NOVA_POSHTA_BRANCH" ? `Відділення №${1 + Math.floor(rand() * 60)}` : null,
        deliveryAddress: deliveryMethod === "COURIER_DNIPRO" ? "вул. Яворницького, 1" : null,
        paymentMethod,
        paymentStatus: status === "CANCELLED" ? "FAILED" : paymentMethod === "CARD_ONLINE" || status === "DELIVERED" ? "PAID" : "PENDING",
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        createdAt,
        items: {
          create: lines.map((l) => ({
            productId: l.v.productId,
            variantId: l.v.id,
            name: l.v.product.translations[0]?.name ?? l.v.product.slug,
            variantName: (l.v.name as { uk?: string }).uk ?? null,
            imageUrl: l.v.product.images[0]?.url ?? null,
            unitPrice: l.v.price,
            quantity: l.quantity,
            total: l.total,
          })),
        },
        events: { create: [{ status: "NEW", message: "Demo order (seed)", createdAt }] },
      },
    });
    if (status !== "CANCELLED") {
      for (const l of lines) {
        await db.product.update({ where: { id: l.v.productId }, data: { salesCount: { increment: l.quantity } } });
      }
    }
  }
  console.log("✓ 48 demo orders (last 60 days)");
}

/**
 * SEED_DEMO_DATA=false → catalog only (products, categories, promo codes, CMS).
 * Use it for a real production store: demo reviews would mislead real customers,
 * and demo customers/orders would pollute revenue and statistics.
 */
const withDemoData = process.env.SEED_DEMO_DATA !== "false";

async function main() {
  await seedRoles();
  await seedAdmin();
  await seedCatalog();
  await seedPromoCodes();
  await seedCms();
  if (withDemoData) {
    const customers = await seedDemoCustomers();
    await seedReviews(customers);
    await seedDemoOrders(customers);
  } else {
    console.log("• Demo customers, reviews and orders skipped (SEED_DEMO_DATA=false)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
