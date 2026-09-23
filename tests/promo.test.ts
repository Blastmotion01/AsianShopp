import { describe, expect, it } from "vitest";
import { checkPromo, normalizeCode, promoDiscount, type PromoRule } from "@/features/promo/validate";

const base: PromoRule = {
  code: "WELCOME10",
  type: "PERCENTAGE",
  value: 10,
  minOrder: 30000,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perUserLimit: null,
  usedCount: 0,
  isActive: true,
};

describe("promo codes", () => {
  it("applies a percentage discount", () => {
    expect(checkPromo(base, { subtotal: 50000 })).toEqual({ ok: true, discount: 5000 });
  });

  it("applies a fixed discount but never more than the subtotal", () => {
    expect(promoDiscount("FIXED", 5000, 20000)).toBe(5000);
    expect(promoDiscount("FIXED", 50000, 20000)).toBe(20000);
  });

  it("rejects unknown and inactive codes", () => {
    expect(checkPromo(null, { subtotal: 50000 })).toMatchObject({ ok: false, error: "promo_invalid" });
    expect(checkPromo({ ...base, isActive: false }, { subtotal: 50000 })).toMatchObject({ ok: false, error: "promo_invalid" });
  });

  it("enforces the minimum order and reports it", () => {
    expect(checkPromo(base, { subtotal: 29999 })).toEqual({ ok: false, error: "promo_min_order", meta: { minOrder: 30000 } });
  });

  it("enforces the date window", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    expect(checkPromo({ ...base, startsAt: new Date("2026-07-01") }, { subtotal: 50000, now })).toMatchObject({ error: "promo_not_started" });
    expect(checkPromo({ ...base, endsAt: new Date("2026-05-01") }, { subtotal: 50000, now })).toMatchObject({ error: "promo_expired" });
  });

  it("enforces total and per-user usage limits", () => {
    expect(checkPromo({ ...base, usageLimit: 5, usedCount: 5 }, { subtotal: 50000 })).toMatchObject({ error: "promo_limit" });
    expect(checkPromo({ ...base, perUserLimit: 1 }, { subtotal: 50000, userUsageCount: 1 })).toMatchObject({ error: "promo_limit" });
  });

  it("normalizes codes", () => {
    expect(normalizeCode("  welcome 10 ")).toBe("WELCOME10");
  });
});
