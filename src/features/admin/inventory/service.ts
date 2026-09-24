import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { weightedAverageCost } from "./costing";

/**
 * Receives goods into stock in one transaction: increases the quantity,
 * recalculates the weighted-average cost of the variant and records the receipt.
 */
export async function receiveStock(input: { variantId: string; quantity: number; unitCost: number; note?: string | null; userName: string }) {
  return db.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({ where: { id: input.variantId }, include: { inventory: true } });
    if (!variant) throw new AppError("not_found", 404);

    const stockBefore = Math.max(0, variant.inventory?.quantity ?? 0);
    const costBefore = variant.costPrice;
    const costAfter = weightedAverageCost(stockBefore, costBefore, input.quantity, input.unitCost);
    const stockAfter = stockBefore + input.quantity;

    await tx.inventory.upsert({
      where: { variantId: variant.id },
      update: { quantity: { increment: input.quantity } },
      create: { variantId: variant.id, quantity: input.quantity },
    });
    await tx.productVariant.update({ where: { id: variant.id }, data: { costPrice: costAfter } });
    return tx.stockReceipt.create({
      data: {
        variantId: variant.id,
        quantity: input.quantity,
        unitCost: input.unitCost,
        stockBefore,
        stockAfter,
        costBefore,
        costAfter,
        note: input.note || null,
        userName: input.userName,
      },
    });
  });
}
