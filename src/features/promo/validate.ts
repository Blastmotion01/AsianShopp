import type { PromoType } from "@prisma/client";

export type PromoRule = {
  code: string;
  type: PromoType;
  value: number;
  minOrder: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type PromoCheck =
  | { ok: true; discount: number }
  | { ok: false; error: "promo_invalid" | "promo_expired" | "promo_not_started" | "promo_min_order" | "promo_limit"; meta?: { minOrder?: number } };

/** Pure promo validation + discount calculation. All amounts in minor units. */
export function checkPromo(
  promo: PromoRule | null,
  ctx: { subtotal: number; now?: Date; userUsageCount?: number },
): PromoCheck {
  const now = ctx.now ?? new Date();
  if (!promo || !promo.isActive) return { ok: false, error: "promo_invalid" };
  if (promo.startsAt && promo.startsAt > now) return { ok: false, error: "promo_not_started" };
  if (promo.endsAt && promo.endsAt < now) return { ok: false, error: "promo_expired" };
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return { ok: false, error: "promo_limit" };
  if (promo.perUserLimit !== null && (ctx.userUsageCount ?? 0) >= promo.perUserLimit) return { ok: false, error: "promo_limit" };
  if (promo.minOrder !== null && ctx.subtotal < promo.minOrder) {
    return { ok: false, error: "promo_min_order", meta: { minOrder: promo.minOrder } };
  }
  return { ok: true, discount: promoDiscount(promo.type, promo.value, ctx.subtotal) };
}

export function promoDiscount(type: PromoType, value: number, subtotal: number) {
  if (subtotal <= 0) return 0;
  const raw = type === "PERCENTAGE" ? Math.round((subtotal * Math.min(100, Math.max(0, value))) / 100) : value;
  return Math.max(0, Math.min(subtotal, raw));
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
