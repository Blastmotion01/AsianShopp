import { describe, expect, it } from "vitest";
import { markupPercent, weightedAverageCost } from "@/features/admin/inventory/costing";

describe("weighted-average cost", () => {
  it("10 pcs @ 60 ₴ on hand + 10 pcs @ 90 ₴ received → 75 ₴", () => {
    expect(weightedAverageCost(10, 6000, 10, 9000)).toBe(7500);
  });

  it("uneven quantities weigh by quantity", () => {
    // 30 @ 50 + 10 @ 70 = 2200 / 40 = 55
    expect(weightedAverageCost(30, 5000, 10, 7000)).toBe(5500);
  });

  it("empty stock or unknown cost → new purchase price", () => {
    expect(weightedAverageCost(0, 6000, 5, 9000)).toBe(9000);
    expect(weightedAverageCost(12, null, 5, 9000)).toBe(9000);
    expect(weightedAverageCost(-3, 6000, 5, 9000)).toBe(9000); // negative stock treated as empty
  });

  it("rounds to whole kopiykas", () => {
    expect(weightedAverageCost(2, 1000, 1, 1001)).toBe(1000); // 1000.33
  });
});

describe("markup", () => {
  it("(price − cost) / cost", () => {
    expect(markupPercent(15000, 10000)).toBeCloseTo(50);
    expect(markupPercent(9000, 10000)).toBeCloseTo(-10);
  });
  it("unknown or zero cost → null", () => {
    expect(markupPercent(15000, null)).toBeNull();
    expect(markupPercent(15000, 0)).toBeNull();
  });
});
