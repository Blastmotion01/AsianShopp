import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pickLocalized } from "@/lib/localized";
import { defaultLocale, PAGE_SIZE, type Locale } from "@/config/site";
import { computeBadges } from "./badges";
import { parseCatalogFilters, type CatalogFilters } from "./filters";
import type { ProductCardData, ProductDetail } from "./types";

const cardInclude = (locale: Locale) =>
  ({
    translations: { where: { locale: { in: [locale, defaultLocale] } } },
    images: { orderBy: { sortOrder: "asc" }, take: 1 },
    brand: true,
    country: true,
    category: true,
    variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { inventory: true } },
  }) satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: ReturnType<typeof cardInclude> }>;

function pickTranslation<T extends { locale: string }>(rows: T[], locale: Locale): T | undefined {
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === defaultLocale) ?? rows[0];
}

export function toCard(p: CardRow, locale: Locale): ProductCardData {
  const tr = pickTranslation(p.translations, locale);
  const stock = p.variants.reduce((s, v) => s + Math.max(0, v.inventory?.quantity ?? 0), 0);
  const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0];
  const name = tr?.name ?? p.slug;
  return {
    id: p.id,
    slug: p.slug,
    name,
    shortDescription: tr?.shortDescription ?? "",
    brand: p.brand?.name ?? null,
    country: p.country ? { code: p.country.code, name: pickLocalized(p.country.name, locale), flag: p.country.flag } : null,
    category: { slug: p.category.slug, name: pickLocalized(p.category.name, locale) },
    price: defaultVariant?.price ?? p.price,
    compareAtPrice: defaultVariant ? defaultVariant.compareAtPrice : p.compareAtPrice,
    image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt || name } : null,
    badges: computeBadges({ ...p, price: defaultVariant?.price ?? p.price, compareAtPrice: defaultVariant?.compareAtPrice ?? p.compareAtPrice }),
    weightGrams: defaultVariant?.weightGrams ?? p.weightGrams,
    volumeMl: p.volumeMl,
    spiceLevel: p.spiceLevel,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock,
    defaultVariantId: defaultVariant?.id ?? null,
    variantCount: p.variants.length,
  };
}

const inStockWhere: Prisma.ProductWhereInput = {
  variants: { some: { isActive: true, inventory: { quantity: { gt: 0 } } } },
};

/** Resolves text search to a Prisma condition across name, description, brand, category and country. */
async function searchWhere(q: string, locale: Locale): Promise<Prisma.ProductWhereInput> {
  const needle = q.toLowerCase();
  const [cats, countries] = await Promise.all([getCategories(), getCountries()]);
  const catIds = cats.filter((c) => matchesAnyLocale(c.nameRaw, needle) || c.slug.includes(needle)).map((c) => c.id);
  const countryIds = countries.filter((c) => matchesAnyLocale(c.nameRaw, needle) || c.slug.includes(needle)).map((c) => c.id);
  const text = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { translations: { some: { locale: { in: [locale, defaultLocale, "en"] }, OR: [{ name: text }, { shortDescription: text }, { description: text }] } } },
      { brand: { name: text } },
      { slug: { contains: needle.replace(/\s+/g, "-") } },
      { tags: { has: needle } },
      ...(catIds.length ? [{ categoryId: { in: catIds } }] : []),
      ...(countryIds.length ? [{ countryId: { in: countryIds } }] : []),
    ],
  };
}

function matchesAnyLocale(value: unknown, needle: string) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, string>).some((s) => typeof s === "string" && s.toLowerCase().includes(needle));
}

export async function buildWhere(f: CatalogFilters, locale: Locale): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (f.q) and.push(await searchWhere(f.q, locale));
  if (f.country.length) and.push({ country: { code: { in: f.country.map((c) => c.toUpperCase()) } } });
  if (f.category.length) and.push({ category: { slug: { in: f.category } } });
  if (f.brand.length) and.push({ brand: { slug: { in: f.brand } } });
  if (f.minPrice !== undefined) and.push({ price: { gte: Math.round(f.minPrice * 100) } });
  if (f.maxPrice !== undefined) and.push({ price: { lte: Math.round(f.maxPrice * 100) } });
  if (f.inStock) and.push(inStockWhere);
  if (f.spice !== undefined) and.push({ spiceLevel: { lte: f.spice } });
  if (f.rating !== undefined) and.push({ rating: { gte: f.rating } });
  if (f.new) and.push({ isNew: true });
  if (f.popular) and.push({ isPopular: true });
  if (f.limited) and.push({ isLimited: true });
  if (f.sale) and.push({ compareAtPrice: { not: null } });
  return { AND: and };
}

function orderBy(sort: CatalogFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ salesCount: "desc" }, { rating: "desc" }, { id: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "priceAsc":
      return [{ price: "asc" }, { id: "asc" }];
    case "priceDesc":
      return [{ price: "desc" }, { id: "asc" }];
    case "rating":
      return [{ rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }];
    default:
      return [{ isFeatured: "desc" }, { isPopular: "desc" }, { salesCount: "desc" }, { createdAt: "desc" }, { id: "asc" }];
  }
}

export async function listProducts(f: CatalogFilters, locale: Locale, pageSize = PAGE_SIZE) {
  const where = await buildWhere(f, locale);
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: orderBy(f.sort),
      skip: (f.page - 1) * pageSize,
      take: pageSize,
      include: cardInclude(locale),
    }),
  ]);
  const items = rows.map((r) => toCard(r, locale));
  return { items, total, page: f.page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Small curated lists for the homepage and product page. */
export async function listProductsWhere(where: Prisma.ProductWhereInput, locale: Locale, take = 8, sort: CatalogFilters["sort"] = "recommended") {
  const rows = await db.product.findMany({
    where: { AND: [{ isActive: true }, where] },
    orderBy: orderBy(sort),
    take,
    include: cardInclude(locale),
  });
  return rows.map((r) => toCard(r, locale));
}

export async function getProductsByIds(ids: string[], locale: Locale) {
  if (!ids.length) return [];
  const rows = await db.product.findMany({ where: { id: { in: ids }, isActive: true }, include: cardInclude(locale) });
  const byId = new Map(rows.map((r) => [r.id, toCard(r, locale)]));
  return ids.map((id) => byId.get(id)).filter((x): x is ProductCardData => !!x);
}

export const getProductBySlug = cache(async (slug: string, locale: Locale): Promise<ProductDetail | null> => {
  const p = await db.product.findUnique({
    where: { slug },
    include: {
      ...cardInclude(locale),
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p || !p.isActive) return null;
  const card = toCard(p, locale);
  const tr = pickTranslation(p.translations, locale);
  return {
    ...card,
    description: tr?.description ?? "",
    ingredients: tr?.ingredients ?? null,
    allergens: tr?.allergens ?? null,
    nutrition: (p.nutrition as Record<string, number> | null) ?? null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt || card.name })),
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: pickLocalized(v.name, locale),
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      weightGrams: v.weightGrams,
      stock: Math.max(0, v.inventory?.quantity ?? 0),
    })),
    seoTitle: pickLocalized(p.seoTitle, locale) || null,
    seoDescription: pickLocalized(p.seoDescription, locale) || null,
    categoryId: p.categoryId,
    countryId: p.countryId,
    tags: p.tags,
    updatedAt: p.updatedAt,
  };
});

export async function getSimilarProducts(p: Pick<ProductDetail, "id" | "categoryId" | "countryId" | "tags">, locale: Locale, take = 8) {
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: p.id },
      OR: [{ categoryId: p.categoryId }, ...(p.countryId ? [{ countryId: p.countryId }] : []), { tags: { hasSome: p.tags } }],
    },
    include: cardInclude(locale),
    take: 24,
  });
  // Rank: same category +3, same country +2, shared tags +1 each
  const scored = rows
    .map((r) => ({
      r,
      score: (r.categoryId === p.categoryId ? 3 : 0) + (r.countryId && r.countryId === p.countryId ? 2 : 0) + r.tags.filter((t) => p.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || b.r.salesCount - a.r.salesCount)
    .slice(0, take);
  return scored.map((s) => toCard(s.r, locale));
}

export async function searchSuggest(q: string, locale: Locale, take = 6) {
  const where = await buildWhere(parseCatalogFilters({ q }), locale);
  const rows = await db.product.findMany({ where, orderBy: [{ salesCount: "desc" }, { id: "asc" }], take, include: cardInclude(locale) });
  return rows.map((r) => toCard(r, locale));
}

// ─── Reference data (cached per request) ─────────────────────

export const getCategories = cache(async () => {
  const rows = await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { isActive: true } } } } } });
  return rows.map((c) => ({ id: c.id, slug: c.slug, nameRaw: c.name, emoji: c.emoji, color: c.color, showOnHome: c.showOnHome, count: c._count.products, descriptionRaw: c.description }));
});

export const getCountries = cache(async () => {
  const rows = await db.country.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { isActive: true } } } } } });
  return rows.map((c) => ({ id: c.id, code: c.code, slug: c.slug, nameRaw: c.name, taglineRaw: c.tagline, flag: c.flag, accentColor: c.accentColor, count: c._count.products }));
});

export const getBrands = cache(async () => {
  return db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true, _count: { select: { products: { where: { isActive: true } } } } } });
});

export async function getPriceBounds() {
  const agg = await db.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } });
  return { min: Math.floor((agg._min.price ?? 0) / 100), max: Math.ceil((agg._max.price ?? 0) / 100) };
}

export async function getPopularSearches(locale: Locale) {
  const rows = await db.product.findMany({
    where: { isActive: true },
    orderBy: { salesCount: "desc" },
    take: 5,
    select: { brand: { select: { name: true } } },
  });
  const brands = [...new Set(rows.map((r) => r.brand?.name).filter(Boolean))] as string[];
  const extra: Record<Locale, string[]> = { uk: ["рамен", "матча", "гостре"], ru: ["рамен", "матча", "острое"], en: ["ramen", "matcha", "spicy"] };
  return [...extra[locale], ...brands].slice(0, 7);
}

export async function getAllProductSlugs() {
  return db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
}
