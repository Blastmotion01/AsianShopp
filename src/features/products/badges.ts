import type { BadgeKind } from "./types";

export function computeBadges(p: {
  isNew: boolean;
  isPopular: boolean;
  isLimited: boolean;
  spiceLevel: number;
  price: number;
  compareAtPrice: number | null;
}): BadgeKind[] {
  const badges: BadgeKind[] = [];
  if (p.compareAtPrice && p.compareAtPrice > p.price) badges.push("SALE");
  if (p.isNew) badges.push("NEW");
  if (p.isLimited) badges.push("LIMITED");
  if (p.isPopular) badges.push("BESTSELLER");
  if (p.spiceLevel >= 3) badges.push("HOT");
  return badges;
}

export function discountPercent(price: number, compareAt: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}
