import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { toMinor } from "@/lib/money";
import { normalizeNutrition, type ProductData } from "./schema";

async function uniqueSlug(base: string, excludeId?: string) {
  const root = base || "product";
  let slug = root;
  for (let i = 2; i < 200; i++) {
    const hit = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
  throw new AppError("slug_taken");
}

const L = (uk: string, ru: string, en: string) => ({ uk, ru: ru || "", en: en || "" });

/** Create or update a product with translations, variants, inventory and images in one transaction. */
export async function saveProduct(data: ProductData) {
  const existing = data.id ? await db.product.findUnique({ where: { id: data.id }, include: { variants: true } }) : null;
  if (data.id && !existing) throw new AppError("not_found", 404);

  // Slug: explicit slug must be free; generated slug gets a numeric suffix.
  let slug: string;
  if (data.slug) {
    const clash = await db.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (clash && clash.id !== data.id) throw new AppError("slug_taken", 400, { field: "slug" });
    slug = data.slug;
  } else {
    slug = existing?.slug ?? (await uniqueSlug(slugify(data.translations.en.name || data.translations.uk.name)));
  }

  // SKU uniqueness across other products
  const skuClash = await db.productVariant.findFirst({
    where: { sku: { in: data.variants.map((v) => v.sku), mode: "insensitive" }, ...(data.id ? { productId: { not: data.id } } : {}) },
    select: { sku: true },
  });
  if (skuClash) throw new AppError("sku_taken", 400, { sku: skuClash.sku });

  const category = await db.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw new AppError("validation");
  const country = data.countryId ? await db.country.findUnique({ where: { id: data.countryId } }) : null;

  let brandId: string | null = null;
  if (data.brandName) {
    const brandSlug = slugify(data.brandName) || "brand";
    const brand = await db.brand.upsert({ where: { slug: brandSlug }, update: {}, create: { slug: brandSlug, name: data.brandName, countryId: country?.id ?? null } });
    brandId = brand.id;
  }

  // No photo yet → illustration generated on the fly by /placeholders/[slug].svg
  // (clearly a placeholder, not a fake photo; nothing is written to storage).
  const images = data.images.length > 0 ? data.images : [{ url: `/placeholders/${slug}.svg`, alt: data.translations.uk.name }];

  const variantRows = data.variants.map((v, i) => ({
    id: v.id,
    sku: v.sku,
    name: L(v.nameUk, v.nameRu, v.nameEn),
    price: toMinor(v.price as number),
    compareAtPrice: v.compareAtPrice ? toMinor(v.compareAtPrice) : null,
    weightGrams: v.weightGrams,
    stock: v.stock,
    isDefault: i === 0,
    sortOrder: i,
  }));
  const main = variantRows[0];

  const productData = {
    slug,
    price: Math.min(...variantRows.map((v) => v.price)),
    compareAtPrice: main.compareAtPrice && main.compareAtPrice > main.price ? main.compareAtPrice : null,
    weightGrams: main.weightGrams,
    volumeMl: data.volumeMl,
    spiceLevel: data.spiceLevel,
    tags: data.tags,
    isNew: data.isNew,
    isPopular: data.isPopular,
    isFeatured: data.isFeatured,
    isLimited: data.isLimited,
    isActive: data.isActive,
    nutrition: normalizeNutrition(data.nutrition) ?? Prisma.DbNull,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    categoryId: category.id,
    countryId: country?.id ?? null,
    brandId,
  };

  return db.$transaction(async (tx) => {
    const product = existing
      ? await tx.product.update({ where: { id: existing.id }, data: productData })
      : await tx.product.create({ data: productData });

    await tx.productTranslation.deleteMany({ where: { productId: product.id } });
    await tx.productTranslation.createMany({
      data: (["uk", "ru", "en"] as const)
        .filter((l) => data.translations[l].name)
        .map((locale) => ({
          productId: product.id,
          locale,
          name: data.translations[locale].name,
          shortDescription: data.translations[locale].shortDescription || data.translations.uk.shortDescription,
          description: data.translations[locale].description || data.translations.uk.description || "",
          ingredients: data.translations[locale].ingredients || null,
          allergens: data.translations[locale].allergens || null,
        })),
    });

    await tx.productImage.deleteMany({ where: { productId: product.id } });
    await tx.productImage.createMany({ data: images.map((img, i) => ({ productId: product.id, url: img.url, alt: img.alt || null, sortOrder: i })) });

    // Variants: update kept, create new, delete removed (order history keeps snapshots).
    const keepIds = variantRows.map((v) => v.id).filter(Boolean) as string[];
    const ownIds = new Set(existing?.variants.map((v) => v.id) ?? []);
    await tx.productVariant.deleteMany({ where: { productId: product.id, id: { notIn: keepIds } } });
    for (const v of variantRows) {
      const payload = { sku: v.sku, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice, weightGrams: v.weightGrams, isDefault: v.isDefault, sortOrder: v.sortOrder, isActive: true };
      const variant =
        v.id && ownIds.has(v.id)
          ? await tx.productVariant.update({ where: { id: v.id }, data: payload })
          : await tx.productVariant.create({ data: { ...payload, productId: product.id } });
      await tx.inventory.upsert({ where: { variantId: variant.id }, update: { quantity: v.stock }, create: { variantId: variant.id, quantity: v.stock } });
    }
    return product;
  });
}

export async function deleteProducts(ids: string[]) {
  const withOrders = await db.orderItem.findMany({ where: { productId: { in: ids } }, select: { productId: true }, distinct: ["productId"] });
  const blocked = new Set(withOrders.map((o) => o.productId));
  const deletable = ids.filter((id) => !blocked.has(id));
  if (deletable.length) await db.product.deleteMany({ where: { id: { in: deletable } } });
  return { deleted: deletable, skipped: [...blocked] as string[] };
}

export async function duplicateProduct(id: string) {
  const p = await db.product.findUnique({ where: { id }, include: { translations: true, images: true, variants: true } });
  if (!p) throw new AppError("not_found", 404);
  const slug = await uniqueSlug(`${p.slug}-copy`);
  const suffix = slug.slice(p.slug.length).toUpperCase();
  return db.product.create({
    data: {
      slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      currency: p.currency,
      weightGrams: p.weightGrams,
      volumeMl: p.volumeMl,
      spiceLevel: p.spiceLevel,
      nutrition: p.nutrition ?? Prisma.DbNull,
      isNew: p.isNew,
      isPopular: p.isPopular,
      isFeatured: false,
      isLimited: p.isLimited,
      isActive: false, // copies start hidden
      tags: p.tags,
      seoTitle: p.seoTitle ?? Prisma.DbNull,
      seoDescription: p.seoDescription ?? Prisma.DbNull,
      brandId: p.brandId,
      countryId: p.countryId,
      categoryId: p.categoryId,
      translations: { create: p.translations.map(({ locale, name, shortDescription, description, ingredients, allergens }) => ({ locale, name: `${name} (copy)`, shortDescription, description, ingredients, allergens })) },
      images: { create: p.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder })) },
      variants: {
        create: p.variants.map((v) => ({
          sku: `${v.sku}${suffix}`.slice(0, 64),
          name: v.name ?? {},
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          weightGrams: v.weightGrams,
          isDefault: v.isDefault,
          sortOrder: v.sortOrder,
          inventory: { create: { quantity: 0 } },
        })),
      },
    },
  });
}
