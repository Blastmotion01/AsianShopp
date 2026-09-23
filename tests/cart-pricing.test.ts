import { describe, expect, it } from "vitest";
import { clampQuantity, computeTotals } from "@/features/cart/pricing";
import { formatPrice, toMinor } from "@/lib/money";

describe("cart pricing", () => {
  const lines = [
    { unitPrice: 6900, quantity: 2 },
    { unitPrice: 12900, quantity: 1 },
  ];

  it("sums lines and applies discount", () => {
    const t = computeTotals(lines, { discount: 1000, freeShippingThreshold: 100000 });
    expect(t.subtotal).toBe(26700);
    expect(t.discount).toBe(1000);
    expect(t.total).toBe(25700);
    expect(t.freeShippingLeft).toBe(100000 - 25700);
  });

  it("charges delivery below the free-shipping threshold and not above it", () => {
    expect(computeTotals(lines, { deliveryMethod: "NOVA_POSHTA_BRANCH", freeShippingThreshold: 100000 }).deliveryFee).toBe(8000);
    expect(computeTotals([{ unitPrice: 100000, quantity: 1 }], { deliveryMethod: "NOVA_POSHTA_BRANCH", freeShippingThreshold: 100000 }).deliveryFee).toBe(0);
  });

  it("threshold is checked after the discount", () => {
    const t = computeTotals([{ unitPrice: 100000, quantity: 1 }], { discount: 10000, deliveryMethod: "COURIER_DNIPRO", freeShippingThreshold: 100000 });
    expect(t.deliveryFee).toBe(9000);
  });

  it("pickup is always free; disabled free shipping always charges", () => {
    expect(computeTotals(lines, { deliveryMethod: "PICKUP_DNIPRO", freeShippingThreshold: null }).deliveryFee).toBe(0);
    const t = computeTotals([{ unitPrice: 500000, quantity: 1 }], { deliveryMethod: "NOVA_POSHTA_BRANCH", freeShippingThreshold: null });
    expect(t.deliveryFee).toBe(8000);
    expect(t.freeShippingLeft).toBeNull();
  });

  it("discount never exceeds subtotal", () => {
    expect(computeTotals(lines, { discount: 999999, freeShippingThreshold: null }).total).toBe(0);
  });

  it("clamps quantities to stock and the per-line max", () => {
    expect(clampQuantity(5, 3, 50)).toBe(3);
    expect(clampQuantity(80, 100, 50)).toBe(50);
    expect(clampQuantity(-2, 10, 50)).toBe(0);
    expect(clampQuantity(Number.NaN, 10, 50)).toBe(1);
  });

  it("formats and parses UAH", () => {
    expect(formatPrice(12900, "uk")).toBe("129 ₴");
    expect(toMinor("129,50")).toBe(12950);
  });
});
