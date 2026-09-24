/**
 * Weighted-average cost after receiving goods (all amounts in minor units).
 *   (stock on hand × current cost + received qty × purchase price) / (stock + received)
 * When nothing is on hand (or no cost is known yet) the new purchase price is used as is.
 */
export function weightedAverageCost(stockBefore: number, costBefore: number | null, quantityIn: number, unitCostIn: number): number {
  const onHand = Math.max(0, stockBefore);
  if (costBefore === null || onHand === 0) return unitCostIn;
  return Math.round((onHand * costBefore + quantityIn * unitCostIn) / (onHand + quantityIn));
}

/** Markup over cost in percent: (price − cost) / cost. null when cost is unknown or zero. */
export function markupPercent(price: number, cost: number | null): number | null {
  if (cost === null || cost <= 0) return null;
  return ((price - cost) / cost) * 100;
}
