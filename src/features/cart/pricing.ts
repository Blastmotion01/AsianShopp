import type { DeliveryMethod } from "@prisma/client";
import { deliveryProvider } from "@/lib/integrations/delivery";

export type PricingLine = { unitPrice: number; quantity: number };

export type Totals = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  /** null when free shipping is disabled */
  freeShippingLeft: number | null;
  freeShippingThreshold: number | null;
};

/** Pure order math shared by cart drawer, checkout summary and order creation. */
export function computeTotals(
  lines: PricingLine[],
  opts: { discount?: number; deliveryMethod?: DeliveryMethod | null; freeShippingThreshold: number | null },
): Totals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discount = Math.min(subtotal, Math.max(0, opts.discount ?? 0));
  const afterDiscount = subtotal - discount;
  const deliveryFee = opts.deliveryMethod ? deliveryProvider.quote(opts.deliveryMethod, afterDiscount, opts.freeShippingThreshold) : 0;
  const freeShippingLeft = opts.freeShippingThreshold === null ? null : Math.max(0, opts.freeShippingThreshold - afterDiscount);
  return {
    subtotal,
    discount,
    deliveryFee,
    total: afterDiscount + deliveryFee,
    freeShippingLeft,
    freeShippingThreshold: opts.freeShippingThreshold,
  };
}

export function clampQuantity(requested: number, stock: number, max: number) {
  if (!Number.isFinite(requested)) return 1;
  return Math.max(0, Math.min(Math.floor(requested), stock, max));
}
