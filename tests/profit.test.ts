import { describe, expect, it } from "vitest";
import { computeProfit } from "@/features/admin/profit";

describe("profit", () => {
  it("net sales minus cost, delivery excluded", () => {
    const r = computeProfit([{ subtotal: 30000, discount: 0, items: [{ total: 30000, quantity: 3, unitCost: 6000 }] }]);
    expect(r.netSales).toBe(30000);
    expect(r.cost).toBe(18000);
    expect(r.profit).toBe(12000);
    expect(r.margin).toBeCloseTo(0.4);
  });

  it("spreads the order discount proportionally across lines", () => {
    // 10% discount on a 200 ₴ order with two 100 ₴ lines, each costing 50 ₴
    const r = computeProfit([
      {
        subtotal: 20000,
        discount: 2000,
        items: [
          { total: 10000, quantity: 1, unitCost: 5000 },
          { total: 10000, quantity: 1, unitCost: 5000 },
        ],
      },
    ]);
    expect(r.netSales).toBe(18000);
    expect(r.profit).toBe(8000);
  });

  it("excludes items without a cost price and reports them", () => {
    const r = computeProfit([
      {
        subtotal: 20000,
        discount: 0,
        items: [
          { total: 10000, quantity: 1, unitCost: 4000 },
          { total: 10000, quantity: 2, unitCost: null },
        ],
      },
    ]);
    expect(r.profit).toBe(6000); // not inflated by the unknown-cost line
    expect(r.coveredSales).toBe(10000);
    expect(r.itemsWithoutCost).toBe(2);
  });

  it("no data → zero profit and no margin", () => {
    expect(computeProfit([])).toMatchObject({ profit: 0, margin: null, itemsWithoutCost: 0 });
  });
});
