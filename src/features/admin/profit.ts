/**
 * Profit from sales, in minor units.
 *   net sales = goods after discounts (delivery fees excluded — they go to the carrier)
 *   profit    = net sales of items with a known cost − their cost
 * Items sold without a cost price are excluded from profit and reported separately,
 * so the figure is never silently inflated.
 */
export type ProfitOrder = {
  subtotal: number;
  discount: number;
  items: { total: number; quantity: number; unitCost: number | null }[];
};

export type ProfitSummary = {
  netSales: number;
  /** Net sales of items whose cost is known — the base for profit and margin */
  coveredSales: number;
  cost: number;
  profit: number;
  /** 0..1, null when there is nothing to measure */
  margin: number | null;
  itemsWithoutCost: number;
};

export function computeProfit(orders: ProfitOrder[]): ProfitSummary {
  let netSales = 0;
  let coveredSales = 0;
  let cost = 0;
  let itemsWithoutCost = 0;

  for (const o of orders) {
    netSales += o.subtotal - o.discount;
    // The order discount is spread across lines proportionally to their value.
    const keep = o.subtotal > 0 ? (o.subtotal - o.discount) / o.subtotal : 0;
    for (const it of o.items) {
      if (it.unitCost === null) {
        itemsWithoutCost += it.quantity;
        continue;
      }
      coveredSales += it.total * keep;
      cost += it.unitCost * it.quantity;
    }
  }

  coveredSales = Math.round(coveredSales);
  const profit = coveredSales - cost;
  return {
    netSales,
    coveredSales,
    cost,
    profit,
    margin: coveredSales > 0 ? profit / coveredSales : null,
    itemsWithoutCost,
  };
}
