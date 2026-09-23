"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStorefront } from "@/lib/revalidate";
import { logAdminAction } from "@/features/admin/log";

const schema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).optional(),
});

export async function setStockAction(input: z.input<typeof schema>): Promise<ActionResult<{ quantity: number }>> {
  try {
    const user = await requirePermission("inventory:write");
    const data = schema.parse(input);
    const before = await db.inventory.findUnique({ where: { variantId: data.variantId }, include: { variant: { select: { sku: true } } } });
    const inv = await db.inventory.upsert({
      where: { variantId: data.variantId },
      update: { quantity: data.quantity, ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}) },
      create: { variantId: data.variantId, quantity: data.quantity, lowStockThreshold: data.lowStockThreshold ?? 5 },
    });
    await logAdminAction(user, "inventory.set", "Inventory", data.variantId, { sku: before?.variant.sku, from: before?.quantity ?? 0, to: inv.quantity });
    revalidateStorefront();
    return { ok: true, data: { quantity: inv.quantity } };
  } catch (err) {
    return toActionError(err);
  }
}
