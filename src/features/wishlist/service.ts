import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { Locale } from "@/config/site";
import { resolveOwner, type Owner } from "@/features/cart/service";
import { getProductsByIds } from "@/features/products/queries";

const where = (o: Owner) => (o.userId ? { userId: o.userId } : { guestId: o.guestId! });

export async function getWishlistIds(): Promise<string[]> {
  const owner = await resolveOwner({ create: false });
  if (!owner) return [];
  const wl = await db.wishlist.findUnique({ where: where(owner), include: { items: { orderBy: { createdAt: "desc" } } } });
  return wl?.items.map((i) => i.productId) ?? [];
}

export async function getWishlistProducts(locale: Locale) {
  return getProductsByIds(await getWishlistIds(), locale);
}

/** Toggles a product; returns the new list of ids. */
export async function toggleWishlist(productId: string): Promise<{ ids: string[]; added: boolean }> {
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, isActive: true } });
  if (!product || !product.isActive) throw new AppError("product_unavailable", 404);
  const owner = (await resolveOwner({ create: true }))!;
  const wl = await db.wishlist.upsert({ where: where(owner), update: {}, create: owner.userId ? { userId: owner.userId } : { guestId: owner.guestId } });
  const existing = await db.wishlistItem.findUnique({ where: { wishlistId_productId: { wishlistId: wl.id, productId } } });
  if (existing) await db.wishlistItem.delete({ where: { id: existing.id } });
  else await db.wishlistItem.create({ data: { wishlistId: wl.id, productId } });
  const items = await db.wishlistItem.findMany({ where: { wishlistId: wl.id }, orderBy: { createdAt: "desc" } });
  return { ids: items.map((i) => i.productId), added: !existing };
}
