"use server";

import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { isLocale } from "@/lib/localized";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getProductsByIds, listProductsWhere } from "@/features/products/queries";
import type { ProductCardData } from "@/features/products/types";
import { answersSchema, rankProducts, type Answers } from "./matcher";

export async function snackMatchAction(input: Answers): Promise<{ ok: boolean; products: ProductCardData[]; fallback: boolean }> {
  const parsed = answersSchema.safeParse(input);
  const raw = await getLocale();
  const locale = isLocale(raw) ? raw : "uk";
  if (!parsed.success) return { ok: false, products: [], fallback: false };
  await enforceRateLimit("snack-match", 30, 60_000);

  const candidates = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      tags: true,
      spiceLevel: true,
      category: { select: { slug: true } },
      variants: { where: { isActive: true }, select: { inventory: { select: { quantity: true } } } },
    },
  });
  const ranked = rankProducts(
    candidates.map((c) => ({
      id: c.id,
      tags: c.tags,
      spiceLevel: c.spiceLevel,
      categorySlug: c.category.slug,
      stock: c.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0),
    })),
    parsed.data,
  );
  if (ranked.length === 0) {
    return { ok: true, products: await listProductsWhere({ isPopular: true }, locale, 6, "popular"), fallback: true };
  }
  return { ok: true, products: await getProductsByIds(ranked.map((r) => r.id), locale), fallback: false };
}
