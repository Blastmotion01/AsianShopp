import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureGuestId, readGuestId, clearGuestId } from "@/lib/auth/guest";
import { pickLocalized } from "@/lib/localized";
import { defaultLocale, MAX_CART_QTY, type Locale } from "@/config/site";
import { freeShippingThreshold } from "@/features/cms/queries";
import { checkPromo, normalizeCode } from "@/features/promo/validate";
import { computeTotals, clampQuantity, type Totals } from "./pricing";

export type Owner = { userId: string; guestId?: undefined } | { guestId: string; userId?: undefined };

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string | null;
  image: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  stock: number;
  available: boolean;
  lineTotal: number;
};

export type CartView = {
  lines: CartLine[];
  count: number;
  promo: { code: string; discount: number; error: string | null; meta?: Record<string, unknown> } | null;
  totals: Totals;
};

/** Cart owner: the signed-in user, otherwise the signed guest cookie. */
export async function resolveOwner(opts: { create: boolean }): Promise<Owner | null> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id };
  const guestId = opts.create ? await ensureGuestId() : await readGuestId();
  return guestId ? { guestId } : null;
}

const ownerWhere = (o: Owner): Prisma.CartWhereUniqueInput => (o.userId ? { userId: o.userId } : { guestId: o.guestId! });

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              translations: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              _count: { select: { variants: { where: { isActive: true } } } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

async function findCart(owner: Owner) {
  return db.cart.findUnique({ where: ownerWhere(owner), include: cartInclude });
}

async function getOrCreateCart(owner: Owner) {
  return db.cart.upsert({
    where: ownerWhere(owner),
    update: {},
    create: owner.userId ? { userId: owner.userId } : { guestId: owner.guestId },
  });
}

function toLines(cart: CartRow | null, locale: Locale): CartLine[] {
  if (!cart) return [];
  return cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const tr = p.translations.find((t) => t.locale === locale) ?? p.translations.find((t) => t.locale === defaultLocale);
    const stock = Math.max(0, v.inventory?.quantity ?? 0);
    const available = p.isActive && v.isActive && stock > 0;
    // Variant label only matters when the product has several variants ("5-pack").
    const variantName = p._count.variants > 1 ? pickLocalized(v.name, locale) : "";
    return {
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: tr?.name ?? p.slug,
      variantName: variantName || null,
      image: p.images[0]?.url ?? null,
      unitPrice: v.price,
      compareAtPrice: v.compareAtPrice,
      quantity: item.quantity,
      stock,
      available,
      lineTotal: available ? v.price * item.quantity : 0,
    };
  });
}

async function userPromoUsage(promoId: string, owner: Owner | null) {
  if (!owner?.userId) return 0;
  return db.promoCodeUsage.count({ where: { promoCodeId: promoId, userId: owner.userId } });
}

export async function buildCartView(cart: CartRow | null, locale: Locale, owner: Owner | null): Promise<CartView> {
  const lines = toLines(cart, locale);
  const pricingLines = lines.filter((l) => l.available).map((l) => ({ unitPrice: l.unitPrice, quantity: Math.min(l.quantity, l.stock) }));
  const subtotal = pricingLines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  let promo: CartView["promo"] = null;
  if (cart?.promoCode) {
    const rule = await db.promoCode.findUnique({ where: { code: cart.promoCode } });
    const check = checkPromo(rule, { subtotal, userUsageCount: rule ? await userPromoUsage(rule.id, owner) : 0 });
    promo = check.ok
      ? { code: cart.promoCode, discount: check.discount, error: null }
      : { code: cart.promoCode, discount: 0, error: check.error, meta: check.meta };
  }
  const totals = computeTotals(pricingLines, { discount: promo?.discount ?? 0, freeShippingThreshold: await freeShippingThreshold() });
  return { lines, count: lines.reduce((s, l) => s + l.quantity, 0), promo, totals };
}

export async function getCartView(locale: Locale): Promise<CartView> {
  const owner = await resolveOwner({ create: false });
  const cart = owner ? await findCart(owner) : null;
  return buildCartView(cart, locale, owner);
}

async function loadSellableVariant(variantId: string) {
  const v = await db.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true, product: { select: { isActive: true } } } });
  if (!v || !v.isActive || !v.product.isActive) throw new AppError("product_unavailable", 404);
  return { variant: v, stock: Math.max(0, v.inventory?.quantity ?? 0) };
}

export async function addToCart(variantId: string, quantity: number, locale: Locale) {
  const owner = (await resolveOwner({ create: true }))!;
  const { stock } = await loadSellableVariant(variantId);
  if (stock <= 0) throw new AppError("out_of_stock", 409);
  const cart = await getOrCreateCart(owner);
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const next = clampQuantity((existing?.quantity ?? 0) + quantity, stock, MAX_CART_QTY);
  if (next <= (existing?.quantity ?? 0)) throw new AppError("insufficient_stock", 409, { available: stock });
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: next },
    create: { cartId: cart.id, variantId, quantity: next },
  });
  return buildCartView(await findCart(owner), locale, owner);
}

export async function setCartQuantity(variantId: string, quantity: number, locale: Locale) {
  const owner = await resolveOwner({ create: false });
  if (!owner) return buildCartView(null, locale, null);
  const cart = await findCart(owner);
  if (!cart) return buildCartView(null, locale, owner);
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  } else {
    const { stock } = await loadSellableVariant(variantId);
    const next = clampQuantity(quantity, stock, MAX_CART_QTY);
    if (next <= 0) await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
    else await db.cartItem.updateMany({ where: { cartId: cart.id, variantId }, data: { quantity: next } });
  }
  return buildCartView(await findCart(owner), locale, owner);
}

export async function applyPromoCode(rawCode: string, locale: Locale) {
  const owner = (await resolveOwner({ create: true }))!;
  const code = normalizeCode(rawCode);
  const cart = (await findCart(owner)) ?? (await getOrCreateCart(owner).then(() => findCart(owner)));
  const view = await buildCartView(cart, locale, owner);
  const rule = code ? await db.promoCode.findUnique({ where: { code } }) : null;
  const check = checkPromo(rule, { subtotal: view.totals.subtotal, userUsageCount: rule ? await userPromoUsage(rule.id, owner) : 0 });
  if (!check.ok) throw new AppError(check.error, 400, check.meta);
  await db.cart.update({ where: ownerWhere(owner), data: { promoCode: code } });
  return buildCartView(await findCart(owner), locale, owner);
}

export async function removePromoCode(locale: Locale) {
  const owner = await resolveOwner({ create: false });
  if (!owner) return buildCartView(null, locale, null);
  await db.cart.updateMany({ where: owner.userId ? { userId: owner.userId } : { guestId: owner.guestId }, data: { promoCode: null } });
  return buildCartView(await findCart(owner), locale, owner);
}

/** After login/registration: move guest cart + wishlist into the user's, then drop the guest cookie. */
export async function mergeGuestIntoUser(userId: string) {
  const guestId = await readGuestId();
  if (!guestId) return;
  const guestCart = await db.cart.findUnique({ where: { guestId }, include: { items: { include: { variant: { include: { inventory: true } } } } } });
  if (guestCart && guestCart.items.length) {
    const userCart = await db.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const item of guestCart.items) {
      const stock = Math.max(0, item.variant.inventory?.quantity ?? 0);
      const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } } });
      const qty = clampQuantity((existing?.quantity ?? 0) + item.quantity, stock, MAX_CART_QTY);
      if (qty <= 0) continue;
      await db.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity: qty },
        create: { cartId: userCart.id, variantId: item.variantId, quantity: qty },
      });
    }
    if (guestCart.promoCode && !userCart.promoCode) {
      await db.cart.update({ where: { id: userCart.id }, data: { promoCode: guestCart.promoCode } });
    }
  }
  if (guestCart) await db.cart.delete({ where: { id: guestCart.id } });

  const guestWishlist = await db.wishlist.findUnique({ where: { guestId }, include: { items: true } });
  if (guestWishlist) {
    const userWishlist = await db.wishlist.upsert({ where: { userId }, update: {}, create: { userId } });
    for (const item of guestWishlist.items) {
      await db.wishlistItem.upsert({
        where: { wishlistId_productId: { wishlistId: userWishlist.id, productId: item.productId } },
        update: {},
        create: { wishlistId: userWishlist.id, productId: item.productId },
      });
    }
    await db.wishlist.delete({ where: { id: guestWishlist.id } });
  }
  await clearGuestId();
}

/** Used by order creation inside a transaction. */
export async function loadCartForCheckout(owner: Owner) {
  return findCart(owner);
}
export type { CartRow };
