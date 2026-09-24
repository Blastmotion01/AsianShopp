"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { toActionError, type ActionResult } from "@/lib/errors";
import { revalidateStorefront } from "@/lib/revalidate";
import { logAdminAction } from "@/features/admin/log";
import { toMinor } from "@/lib/money";
import { receiveStock } from "./service";

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

const receiptSchema = z.object({
  variantId: z.string().min(1).max(40),
  quantity: z.coerce.number().int("invalid").min(1, "required").max(1_000_000),
  // UAH as typed by the admin ("54,50" or "54.5")
  unitCost: z
    .union([z.string(), z.number()])
    .transform((v) => toMinor(v))
    .pipe(z.number().int().min(0, "invalid").max(100_000_000)),
  note: z.string().trim().max(200).optional().default(""),
});

/** Goods receipt: adds stock and recalculates the weighted-average cost. */
export async function receiveStockAction(input: z.input<typeof receiptSchema>): Promise<ActionResult<{ costAfter: number; stockAfter: number }>> {
  try {
    const user = await requirePermission("inventory:write");
    const parsed = receiptSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "validation", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
    const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const r = await receiveStock({ ...parsed.data, userName });
    await logAdminAction(user, "inventory.receive", "Inventory", parsed.data.variantId, {
      quantity: r.quantity,
      unitCost: r.unitCost,
      costBefore: r.costBefore,
      costAfter: r.costAfter,
    });
    revalidateStorefront();
    return { ok: true, data: { costAfter: r.costAfter, stockAfter: r.stockAfter } };
  } catch (err) {
    return toActionError(err);
  }
}
